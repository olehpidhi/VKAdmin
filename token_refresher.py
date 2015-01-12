from __future__ import print_function
import vk_auth
import time

with open("config.ini", "r") as config_file:
    user_data = config_file.read().split('\n')

expires_in = 0
while True:
    time.sleep(float(expires_in))
    try:
        token, user_id, expires_in = vk_auth.auth(user_data[0], user_data[1], user_data[2], "photos")
        with open("token", "w") as token_file:
            print(token, file = token_file)
    except Exception:
        print("Connection error")
        expires_in = 20

