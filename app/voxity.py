# -*- coding: utf-8 -*-
"""Voxity api module."""
from __future__ import absolute_import, division, unicode_literals
from requests_oauthlib import OAuth2Session
from flask import current_app, session
from datetime import datetime, timedelta
from app.utils import datetime_to_timestamp
voxity_bind = None


def token_is_expired(**kwargs):
    """
    :param dict token: *optional* token object, default, the session token
    :return: true if token is expired
    :retype: bool
    """
    token_expire_date = datetime.fromtimestamp(
        kwargs.get('token', session['oauth_token']['expires_at'])
    )

    return token_expire_date <= datetime.now()


def save_token(token):
    '''
    :param dict token: token object
    :retype: None
    '''
    duration = timedelta(days=7)
    token['oauth_token']['expires_in'] = int(duration.total_seconds())
    token['oauth_token']['expires_at'] = datetime_to_timestamp(
        datetime.now() + duration
    )


def connectors(**kwargs):
    """
    :retryp:OAuth2Session
    """
    token = kwargs.get('token', session['oauth_token'])

    if token_is_expired():
        conn = OAuth2Session(current_app.config['CLIENT_ID'], token=token)
        token = conn.refresh_token(
            current_app.config['VOXITY']['request_token_url'],
            **{
                'client_id': current_app.config['CLIENT_ID'],
                'client_secret': current_app.config['CLIENT_SECRET']
            }
        )

        token = save_token(token)
    return OAuth2Session(
        current_app.config['CLIENT_ID'],
        token=token
    )


def bind(**kwargs):
    return OAuth2Session(current_app.config['CLIENT_ID'], **kwargs)


def pager_dict(headers):
    return {
        'total': headers.get('x-paging-total-records', None),
        'curent_page': headers.get('x-paging-page', 1),
        'max_page': headers.get('x-paging-total-pages', None)
    }


def get_devices():
    """
    :retyp: list
    :return: device list
    """
    return connectors().get(
        current_app.config['BASE_URL'] + '/devices/'
    ).json()['data']


def get_device(d_id):
    """
    :param str d_ind: device id
    :retype: dict
    :return: one device
    """
    return connectors().get(
        current_app.config['BASE_URL'] + '/devices/' + d_id
    ).json()['data']


def get_contacts(**kwargs):
    """
    :param int page: page number *default None*
    :param int limit: limit contact in response *default None*
    :param str name: name filter
    :retype: list
    :return: contact list
    """
    if 'cn' in kwargs:
        kwargs['cn'] = "*{0}*".format(kwargs['cn'])
    resp = connectors().get(
        current_app.config['BASE_URL'] + '/contacts/',
        params=kwargs
    )
    data = {}
    data['list'] = resp.json()['result']
    data['pager'] = pager_dict(resp.headers)
    return data


def call(exten):
    return connectors().post(
        current_app.config['BASE_URL'] + '/channels',
        data={'exten': exten}
    ).json()


def self_user():
    return connectors().get(
        current_app.config['BASE_URL'] + '/users/self'
    ).json()

def logout():
    resp = connectors().get(current_app.config['BASE_URL'] + "/logout")
    session['user'] = {}
    session['oauth_token'] = {}
    session['oauth_state'] = {}

    return resp


def get_calls_log(**kwargs):
    resp = connectors().get(
        current_app.config['BASE_URL'] + '/calls/logs',
        params=kwargs
    )

    data = {}
    data['list'] = resp.json()['result']
    data['pager'] = pager_dict(resp.headers)

    return data
