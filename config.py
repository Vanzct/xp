# coding: utf-8
import os
basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get('SECRENT_KEY') or "vinci-xman@vinci.im"

    def __init__(self):
        pass


class DevConfig(object, Config):

    ENV = 'dev'


class TestConfig(object, Config):
    ENV = 'test'


class ProdConfig(object, Config):
    ENV = 'prod'


config_dict = {
    "dev": DevConfig,
    "test": TestConfig,
    "prod": ProdConfig,
    "default": DevConfig
}