from flask import Flask, jsonify,request
from flask_cors import CORS
# from flask import session
# from flask_session import Session
from PIL import Image
import numpy as np
import cv2
import tensorflow as tf
import hashlib
# import sys
# from keras.models import load_model
# from keras import Model
# from keras.layers import Input,Conv2D, PReLU,BatchNormalization,UpSampling2D,add
import io
# import os
import base64
from base64 import b64encode
from json import dumps
# from gevent.pywsgi import WSGIServer

import sqlite3

def create_user_table():
    conn = sqlite3.connect('data.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  username TEXT UNIQUE NOT NULL,
                  password TEXT NOT NULL)''')
    conn.commit()
    conn.close()

create_user_table()

def create_images_table():
    conn = sqlite3.connect('data.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS images
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  user_id INTEGER NOT NULL,
                  image_data BLOB NOT NULL,
                  FOREIGN KEY(user_id) REFERENCES users(id))''')
    conn.commit()
    conn.close()

create_images_table()

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

#SRGAN model
def res_block(ip):

    res_model = Conv2D(64, (3,3), padding = "same")(ip)
    res_model = BatchNormalization(momentum = 0.5)(res_model)
    res_model = PReLU(shared_axes = [1,2])(res_model)

    res_model = Conv2D(64, (3,3), padding = "same")(res_model)
    res_model = BatchNormalization(momentum = 0.5)(res_model)

    return add([ip,res_model])

def upscale_block(ip):

    up_model = Conv2D(256, (3,3), padding="same")(ip)
    up_model = UpSampling2D( size = 2 )(up_model)
    up_model = PReLU(shared_axes=[1,2])(up_model)

    return up_model

def create_gen(gen_ip, num_res_block):
    layers = Conv2D(64, (9,9), padding="same")(gen_ip)
    layers = PReLU(shared_axes=[1,2])(layers)

    temp = layers

    for i in range(num_res_block):
        layers = res_block(layers)

    layers = Conv2D(64, (3,3), padding="same")(layers)
    layers = BatchNormalization(momentum=0.5)(layers)
    layers = add([layers,temp])

    layers = upscale_block(layers)
    layers = upscale_block(layers)

    op = Conv2D(3, (9,9), padding="same")(layers)

    return Model(inputs=gen_ip, outputs=op)


#ESRGAN model
import os
import cv2
import numpy as np
from keras.optimizers import Adam
import matplotlib.pyplot as plt
from tensorflow.keras.models import Sequential
from tensorflow.keras import layers, Model
from sklearn.model_selection import train_test_split

from tensorflow.keras.layers import Conv2D, PReLU,BatchNormalization, Flatten, MaxPooling2D
from tensorflow.keras.layers import UpSampling2D, LeakyReLU, Dense, Input, add
from tqdm import tqdm
from tensorflow.keras.layers import Add, BatchNormalization, Conv2D, Dense, Flatten, Input, LeakyReLU, PReLU, Lambda, Activation, Concatenate, Multiply, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.applications.vgg19 import VGG19
# LR_SIZE = 56
# HR_SIZE = LR_SIZE*4
upscaling_factor = 4
channels = 3
filters = 64
def SubpixelConv2D(name, scale=2):

        def subpixel_shape(input_shape):
            dims = [input_shape[0],
                    None if input_shape[1] is None else input_shape[1] * scale,
                    None if input_shape[2] is None else input_shape[2] * scale,
                    int(input_shape[3] / (scale ** 2))]
            output_shape = tuple(dims)
            return output_shape

        def subpixel(x):
            return tf.nn.depth_to_space(x, scale)

        return Lambda(subpixel, output_shape=subpixel_shape, name=name)

def upsample(x, number):
    x = Conv2D(256, kernel_size=3, strides=1, padding='same', name='upSampleConv2d_' + str(number))(x)
    x = SubpixelConv2D(name = str('upSampleSubPixel_') + str(number) , scale = 2)(x)
    x = PReLU(shared_axes=[1, 2], name='upSamplePReLU_' + str(number))(x)
    return x

def dense_block(input):

  x1 = Conv2D(64, kernel_size=3, strides=1, padding='same')(input)
  x1 = LeakyReLU(0.2)(x1)
  x1 = Concatenate()([input, x1])

  x2 = Conv2D(64, kernel_size=3, strides=1, padding='same')(x1)
  x2 = LeakyReLU(0.2)(x2)
  x2 = Concatenate()([input, x1, x2])

  x3 = Conv2D(64, kernel_size=3, strides=1, padding='same')(x2)
  x3 = LeakyReLU(0.2)(x3)
  x3 = Concatenate()([input, x1, x2, x3])

  x4 = Conv2D(64, kernel_size=3, strides=1, padding='same')(x3)
  x4 = LeakyReLU(0.2)(x4)
  x4 = Concatenate()([input, x1, x2, x3, x4])

  x5 = Conv2D(64, kernel_size=3, strides=1, padding='same')(x4)
  x5 = Lambda(lambda x: x * 0.2)(x5)
  x = Add()([x5, input])
  return x

def RRDB(input):
    x = dense_block(input)
    x = dense_block(x)
    x = dense_block(x)
    x = Lambda(lambda x: x * 0.2)(x)
    out = Add()([x, input])
    return out

def sr_resnet(lr_ip,num_filters=64, num_res_blocks=16):
    # lr_input = Input(shape=(56, 56, 3))
    lr_input = lr_ip

    x_start = Conv2D(64, kernel_size=3, strides=1, padding='same')(lr_input)
    x_start = LeakyReLU(0.2)(x_start)

    x = RRDB(x_start)

    x = Conv2D(64, kernel_size=3, strides=1, padding='same')(x)
    x = Lambda(lambda x: x * 0.2)(x)
    x = Add()([x, x_start])

    x = upsample(x, 1)
    if upscaling_factor > 2:
            x = upsample(x, 2)
    if upscaling_factor > 4:
            x = upsample(x, 3)

    x = Conv2D(64, kernel_size=3, strides=1, padding='same')(x)
    x = LeakyReLU(0.2)(x)
    # hr_output = Conv2D(channels, kernel_size=3, strides=1, padding='same', activation='None')(x)
    hr_output = Conv2D(channels, kernel_size=3, strides=1, padding='same')(x)
    model = Model(inputs=lr_input, outputs=hr_output)
    return model

def sr_resnet_swin(lr_ip,num_filters=64, num_res_blocks=16):
    # lr_input = Input(shape=(56, 56, 3))
    lr_input = lr_ip

    x_start = Conv2D(64, kernel_size=3, strides=1, padding='same')(lr_input)
    x_start = LeakyReLU(0.2)(x_start)

    x = RRDB(x_start)

    x = Conv2D(64, kernel_size=3, strides=1, padding='same')(x)
    x = Lambda(lambda x: x * 0.2)(x)
    x = Add()([x, x_start])

    x = upsample(x, 1)
    if upscaling_factor > 2:
            x = upsample(x, 2)
    if upscaling_factor > 4:
            x = upsample(x, 3)

    x = Conv2D(64, kernel_size=3, strides=1, padding='same')(x)
    x = LeakyReLU(0.2)(x)
    hr_output = Conv2D(channels, kernel_size=3, strides=1, padding='same', activation='tanh')(x)
    # hr_output = Conv2D(channels, kernel_size=3, strides=1, padding='same')(x)
    model = Model(inputs=lr_input, outputs=hr_output)
    return model


app = Flask(__name__)
# app.config['SESSION_TYPE'] = 'filesystem'
# app.config["SESSION_PERMANENT"] = True
# app.config['SECRET_KEY'] = '%@6aq47jjB6D!A9h'
# Session(app)
CORS(app)

@app.route('/diagnosis', methods=['POST'])
def analyze():
    # tumour_model = Sequential([
    # Input(shape = (img_size, img_size, 1)),
    # Conv2D(32, kernel_size = (3, 3), strides = 1, padding = 'same', activation = 'relu'),
    # MaxPooling2D(pool_size = (2, 2), strides = 2, padding = 'valid'),
    # Conv2D(64, kernel_size = (3, 3), strides = 1, padding = 'same', activation = 'relu'),
    # MaxPooling2D(pool_size = (2, 2), strides = 2, padding = 'valid'),
    # Conv2D(128, kernel_size = (3, 3), strides = 1, padding = 'same', activation = 'relu'),
    # MaxPooling2D(pool_size = (2, 2), strides = 2, padding = 'valid'),
    # Flatten(),
    # Dense(128, activation = 'relu'),
    # Dropout(0.5),
    # Dense(4, activation = 'softmax')
    # ])

    # tumour_model.load_weights('./models/tumour_model.h5')

    # dementia_model = Sequential([
    # Rescaling(1./255, input_shape=(128, 128, 3)),
    # Conv2D(filters=16, kernel_size=(3, 3), padding='same', activation = 'relu', input_shape = (128, 128, 3), kernel_initializer="he_normal"),
    # MaxPooling2D(),
    # Conv2D(filters=32, kernel_size=(3, 3), padding='same', activation = 'relu', input_shape = (128, 128, 3), kernel_initializer="he_normal"),
    # MaxPooling2D(),
    # Dropout(0.25),
    # Flatten(),
    # Dense(units = 128, activation = 'relu', kernel_initializer="he_normal"),
    # Dense(units = 64, activation = 'relu'),
    # Dense(units = 4, activation = 'softmax')
    # ])

    # dementia_model.load_weights('./models/dementia_model.h5')

    # img = Image.open(file)
    # img = img.convert("RGB")

    # im_x,im_y=img.size
    # # print(im_x)
    # # print(im_y)
    # lr_ip = Input(shape=(im_x,im_x,3))
    pass




@app.route('/image', methods=['POST'])
def upload_image():
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'})

    file = request.files['file']
    userName = request.form.get('userName')

    #fetch user id#########################
    conn = sqlite3.connect('data.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (userName,))
    user = c.fetchone()
    user_id=user[0]
    conn.close()
    #######################################


    selected_model = request.form.get("model")

    img = Image.open(file)
    img = img.convert("RGB")

    im_x,im_y=img.size
    # print(im_x)
    # print(im_y)
    lr_ip = Input(shape=(im_x,im_x,3))


    generator = sr_resnet(lr_ip)
    if selected_model == "rrdb":
        generator.load_weights('./models/rrdbnet_mse.h5')
    elif selected_model == "esrgan":
        generator = sr_resnet_swin(lr_ip)
        generator.load_weights('./models/swin_gen_e_63.h5')
    elif selected_model == "srgan":
        generator=create_gen(lr_ip,num_res_block=16)
        generator.load_weights('./models/srgan.h5')
    else:
        return jsonify({'error': f'Model {selected_model} not supported'}), 400
    
    # generator.summary()


    img=np.array(img)
    # img = img[:, :, ::-1].copy()
    X1 = cv2.resize(img,(im_x,im_x), interpolation = cv2.INTER_AREA)
    X = np.reshape(X1, (1,im_x,im_x, 3))
    X_batch = tf.cast(X, tf.float32)


    # generator.load_weights('./models/rrdbnet_mse.h5')
    # generator.load_weights('./models/swin_gen_e_4.h5')
    Y = generator(X_batch/255)

    # img_array = np.array(img) / 255.0
    # img_array = np.expand_dims(img_array, axis=0)

    
    # print(f"array shape : {np.array(img_array).shape}")

    # prediction = model.predict(img_array)
    output=Y[0] * 255
    processed_image = Image.fromarray((np.clip(output, 0, 255).astype(np.uint8)).astype(np.uint8))
    if (im_x!=im_y):
        processed_image = processed_image.resize((im_x*4,im_y*4),Image.LANCZOS)

    img_bytes = io.BytesIO()

    processed_image.save(img_bytes, format='PNG')

    #Insert image into database#######################
    blob_data = img_bytes.getvalue()
    conn = sqlite3.connect('data.db')
    c = conn.cursor()

    c.execute("SELECT COUNT(*) FROM images WHERE user_id = ? AND image_data = ?", (user_id, blob_data,))
    count = c.fetchone()[0]
    if(count>0):
        message="error : Image already exists"
    else:
        try:
            c.execute("INSERT INTO images (user_id, image_data) VALUES (?, ?)", (user_id, blob_data))
            conn.commit()
            message = {'message': 'Image inserted successfully'}
        except Exception as e:
            conn.rollback()
            message = {'error': f'Error inserting image: {str(e)}'}
        finally:
            conn.close()

    print(message)
    ###################################################

    base64_bytes = b64encode(img_bytes.getvalue())

    base64_string = base64_bytes.decode('utf-8')

    raw_data = {'image': base64_string}

    json_data = dumps(raw_data, indent=2)

    return json_data
    

@app.route('/display', methods=['POST'])
def display_images():
    data = request.json
    username = data.get('userName')

    conn = sqlite3.connect('data.db')
    c = conn.cursor()
    c.execute("SELECT image_data FROM images INNER JOIN users ON images.user_id = users.id WHERE users.username = ?", (username,))
    images = c.fetchall()
    conn.close()

    base64_images = [b64encode(image[0]).decode('utf-8') for image in images]

    return jsonify(base64_images)

@app.route('/delete_image', methods=['POST'])
def delete_image():
    data = request.json
    image_to_delete = data.get('image')
    image_to_delete_bytes = base64.b64decode(image_to_delete)
    username = data.get('userName')  

    conn = sqlite3.connect('data.db')
    c = conn.cursor()
    c.execute("DELETE FROM images WHERE user_id = (SELECT id FROM users WHERE username = ?) AND image_data = ?", (username, image_to_delete_bytes,))
    conn.commit()
    conn.close()

    return jsonify({'message': 'Image deleted successfully'})


@app.route('/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('email')
    password = data.get('password')

    hashed_password = hash_password(password)

    conn = sqlite3.connect('data.db')
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        return jsonify({'message': 'User registered successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already exists'}),401
    finally:
        conn.close()

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('email')
    password = data.get('password')

    conn = sqlite3.connect('data.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    
    if user:
        stored_hashed_password = user[2]  # Assuming the hashed password is stored in the third column
        
        entered_hashed_password = hash_password(password)
        
        if stored_hashed_password == entered_hashed_password:
            # session['user_id'] = user[0]  # Assuming the user ID is stored in the first column

            # user_id = session.get('user_id')
            # print("User ID:", user_id)
            # print(user[0])
            return jsonify({'message': 'Login successful', 'user_name': username})
    
    return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/logout', methods=['POST'])
def logout():
    # user_id = session.get('user_id')
    # print("User ID:", user_id)
    # if 'user_id' in session:
    #     session.pop('user_id')  # Remove user ID from session
    
    # # Optionally, you can clear the entire session if needed
    # session.clear()  # Clear all session data
    # g.username=""
    
    return jsonify({'message': 'Logout successful'})
      
if __name__ == '__main__':
    app.run(debug=False)
    # http_server = WSGIServer(('', 5000), app)
    # http_server.serve_forever()



