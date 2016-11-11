# -*- coding:utf-8 -*-
__author__ = 'Van.zx'

from flask import Flask, current_app, render_template
# from flask.ext.cache import Cache
# from flask.ext.bootstrap import Bootstrap
# from flask.ext.mail import Mail
# from flask.ext.moment import Moment
# from flask.ext.sqlalchemy import SQLAlchemy
from config import config_dict
import sys

import logging
from logging.handlers import RotatingFileHandler
# bootstrap = Bootstrap()
# mail = Mail()
# moment = Moment()
# db = SQLAlchemy()
# convert python's encoding to utf8
try:
    from imp import reload
    reload(sys)
    sys.setdefaultencoding('utf8')
except (AttributeError, NameError):
    pass


def _import_submodules_from_package(package):
    import pkgutil

    modules = []
    for importer, modname, ispkg in pkgutil.iter_modules(package.__path__,
                                                         prefix=package.__name__ + "."):
        modules.append(__import__(modname, fromlist="dummy"))
    return modules


def create_app(config_mode):
    app = Flask(__name__)
    app.config.from_object(config_dict[config_mode])
    # config_dict[config_mode].init_app(app)
    app.config_mode = config_mode

    # cache = Cache(app, config={'CACHE_TYPE': 'simple'})
    # cache.init_app(app)
    # 内部日志
    rotating_handler1 = RotatingFileHandler('logs/info.log', maxBytes=1 * 1024 * 1024, backupCount=5)
    rotating_handler2 = RotatingFileHandler('logs/error.log', maxBytes=1 * 1024 * 1024, backupCount=2)

    formatter1 = logging.Formatter("-" * 100 +
                                   '\n %(asctime)s %(levelname)s - '
                                   'in %(funcName)s [%(filename)s:%(lineno)d]:\n %(message)s')

    rotating_handler1.setFormatter(formatter1)
    rotating_handler2.setFormatter(formatter1)
    app.logger.addHandler(rotating_handler1)
    app.logger.addHandler(rotating_handler2)

    app.logger.setLevel(logging.INFO)
    rotating_handler2.setLevel(logging.ERROR)
    if app.config.get("DEBUG"):
        # app.logger.addHandler(logging.StreamHandler())
        app.logger.setLevel(logging.DEBUG)

    # bootstrap.init_app(app)
    # mail.init_app(app)
    # moment.init_app(app)
    # db.init_app(app)

    # from apps.routes import main
    # app.register_blueprint(main)
    from .controllers.wx import api
    app.register_blueprint(api)

    @app.route('/', methods=['GET'])
    def home():
        if current_app.config.get("ENV") == "dev":
            return render_template("debug.html")
        else:
            return render_template("index.html")

    @app.route('/index', methods=['GET'])
    def index():
        return render_template("index.html")

    return app
