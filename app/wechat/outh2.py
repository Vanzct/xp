# -*-coding: utf-8 -*-

import requests
import json
from .helper import url_params_encode_str
import hashlib
import urllib2


class ApiConfig(object):
    def __init__(self, appid, app_secret, redirect_uri, noncestr):
        self.appid = appid
        self.app_secret = app_secret
        self.redirect_uri = redirect_uri
        self.noncestr = noncestr

        self.authorize_path = "https://open.weixin.qq.com/connect/oauth2/authorize"
        self.access_token_path = "https://api.weixin.qq.com/sns/oauth2/access_token"
        self.refresh_token_path = "https://api.weixin.qq.com/sns/oauth2/refresh_token"

        self.user_info_path = "https://api.weixin.qq.com/sns/userinfo"
        # 微信通用access_token
        self.credential_path = "https://api.weixin.qq.com/cgi-bin/token"
        self.jsapi_ticket_path = "https://api.weixin.qq.com/cgi-bin/ticket/getticket"
        self.menu_create_path = "https://api.weixin.qq.com/cgi-bin/menu/create"
        self.menu_del_path = "https://api.weixin.qq.com/cgi-bin/menu/delete"

    def __str__(self):
        return "appid:%s, redirect_uri:%s, noncestr:%s" % \
               (self.appid, self.redirect_uri, self.noncestr)


def parse_response(url):
    response = requests.get(url)
    parsed_content = json.loads(response.content.decode())

    if parsed_content.get('errcode', 0):
        print "error code:", parsed_content.get('errcode', 0)
        raise WechatRequestError(
            parsed_content.get("errcode", 0),
            parsed_content.get("errmsg", "")
        )
    return parsed_content


class WechatApi(object):
    def __init__(self, api_config):
        self.wechat_request = WechatRequest(api_config)

    def url_for_code(self, scope, url, state=None):
        # 网页授权第一步，用户到此url页面进行登录验证
        return self.wechat_request.url_for_code(scope, url, state)

    def code_to_access_token(self, code):
        # 网页登录第二步,通过以下url用code换取 access_token
        resp = self.wechat_request.code_to_access_token(code)
        open_id = resp.get("openid", "")
        access_token = resp.get("access_token")
        refresh_token = resp.get("refresh_token")
        return open_id, access_token, refresh_token

    def refresh_access_token(self, access_token):
        # 刷新token, 以便用户不是每次都登录
        self.wechat_request.refresh_access_token(access_token)

    def get_user_info(self, access_token, openid):
        return self.wechat_request.get_user_info(access_token, openid)

    def get_credential(self):
        return self.wechat_request.get_credential()

    def get_jsapi_ticket(self, access_token):
        # 微信js-sdk 需要的签名
        return self.wechat_request.get_jsapi_ticket(access_token)

    def generate_jsapi_signature(self, ticket, timestamp, url):
        return self.wechat_request.generate_jsapi_signature(ticket, timestamp, url)

    def set_menu(self, menu_json, access_token):
        return self.wechat_request.set_menu(menu_json, access_token)

    def del_menu(self, access_token):
        return self.wechat_request.del_menu(access_token)


class WechatRequestError(Exception):
    def __init__(self, code, msg):
        self.code = code
        self.message = msg

    def __str__(self):
        return '%s: %s' % (self.code, self.message)


class WechatRequest(object):

    def __init__(self, api_config):
        self.api_config = api_config

    def url_for_code(self, scope, url, state=None):
        # 登录注册的URL
        client_params = {
            "appid": self.api_config.appid,
            "response_type": "code",
            "redirect_uri": url
        }
        # print client_params["redirect_uri"]
        client_params.update(scope=scope)
        if state:
            client_params.update(state=state)

        url_params = url_params_encode_str(client_params, sort=True)
        return "%s?%s#wechat_redirect" % (self.api_config.authorize_path, url_params)

    def url_for_code_to_access_token(self, code):
        # CODE 换取 ACCESS_TOKEN
        app_params = {
            "appid": self.api_config.appid,
        }

        app_params.update(code=code,
                          secret=self.api_config.app_secret,
                          redirect_uri=self.api_config.redirect_uri,
                          grant_type="authorization_code")

        url_params = url_params_encode_str(app_params)

        return "%s?%s" % (self.api_config.access_token_path, url_params)

    def url_for_refresh_access_token(self, refresh_token):
        # refresh access token
        app_params = {
            "appid": self.api_config.appid,
        }

        app_params.update(refresh_token=refresh_token,
                          grant_type="refresh_token")

        url_params = url_params_encode_str(app_params)
        return "%s?%s" % (self.api_config.refresh_token_path, url_params)

    def url_for_user_info(self, access_token, openid):
        params = {
            "access_token": access_token,
            "openid": openid,
            "lang": "zh_CN",
        }
        url_params = url_params_encode_str(params)
        return "%s?%s" % (self.api_config.user_info_path, url_params)

    def _url_for_credential(self):
        # 公众号的access_token
        app_params = {
            "appid": self.api_config.appid,
            "secret": self.api_config.app_secret,
            "grant_type": "client_credential"
        }
        url_params = url_params_encode_str(app_params)
        return "%s?%s" % (self.api_config.credential_path, url_params)

    def _url_for_jsapi_ticket(self, access_token):
        params = {
            "access_token": access_token,
            "type": "jsapi"
        }
        url_params = url_params_encode_str(params)
        return "%s?%s" % (self.api_config.jsapi_ticket_path, url_params)

    # def _url_for_set_menu(self, access_token):
    #     return "%s?access_token=%s" % (self.api_config.menu_create_path, access_token)

    def _url_for_del_menu(self, access_token):
        return "%s?access_token=%s" % (self.api_config.menu_del_path, access_token)

    def code_to_access_token(self, code):
        url = self.url_for_code_to_access_token(code)
        return parse_response(url)

    def refresh_access_token(self, refresh_token):
        url = self.url_for_refresh_access_token(refresh_token)
        return parse_response(url)

    def get_user_info(self, access_token, openid):
        url = self.url_for_user_info(access_token, openid)
        response = requests.get(url)
        parsed_content = json.loads(response.content)

        if parsed_content.get('errcode', 0):
            print "error code:", parsed_content.get('errcode', 0)
            raise WechatRequestError(
                parsed_content.get("errcode", 0),
                parsed_content.get("errmsg", "")
            )
        return parsed_content

    def get_jsapi_ticket(self, access_token):
        m_url = self._url_for_jsapi_ticket(access_token)
        return parse_response(m_url)

    def generate_jsapi_signature(self, ticket, timestamp, url):
        # url_params = url_params_encode_str(params)
        url_params = "jsapi_ticket=%s&noncestr=%s&timestamp=%s&url=%s" % (ticket, self.api_config.noncestr, timestamp, url)
        print "***", url_params
        hash_sha1 = hashlib.sha1(url_params)
        signature = hash_sha1.hexdigest()
        return signature

    def get_credential(self):
        url = self._url_for_credential()
        return parse_response(url)

    def set_menu(self, menu_json, access_token):
        url = "%s?access_token=%s" % (self.api_config.menu_create_path, access_token)
        req = urllib2.Request(url)
        req.add_header('Content-Type', 'application/json')
        req.add_header('encoding', 'utf-8')
        response = urllib2.urlopen(req, json.dumps(menu_json, ensure_ascii=False))
        result = response.read()
        # response = requests.post(url, menu_json)
        # parsed_content = json.loads(response.content)
        return result

    def del_menu(self, access_token):
        url = "%s?access_token=%s" % (self.api_config.menu_del_path, access_token)
        req = urllib2.Request(url)
        req.add_header('Content-Type', 'application/json')
        req.add_header('encoding', 'utf-8')
        response = urllib2.urlopen(req)
        result = response.read()
        return result