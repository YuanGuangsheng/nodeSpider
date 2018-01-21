/**
 * 通用公用方法
 */
'use strict'
import Assert from 'assert'
import _debug from 'debug'
const debug = _debug('util')

const moment = require('moment')
moment.locale('cn')

//用于 md5
const crypto = require('crypto')
export const hash = crypto.createHash('md5')


export const isFunction = val => Object.prototype.toString.call(val) === '[object Function]'


export function formatNum(num, length) {
    num = (isNaN(num) ? 0 : num).toString()
    let n = length - num.length

    return n > 0 ? [new Array(n + 1).join('0'), num].join('') : num
}

export const assert = {
    equal(actual, expected, message) {
        try {
            Assert.equal(actual, expected)
        } catch (e) {
            debug(e)
            throw message
        }
    },
    notEqual(actual, expected, message) {
        try {
            Assert.notEqual(actual, expected)
        } catch (e) {
            debug(e)
            throw message
        }
    },
    ok(actual, message) {
        try {
            Assert.ok(actual)
        } catch (e) {
            debug(e)
            throw message
        }
    }
}


/**
 * 生成唯一code
 * todo 用snowflake来代替？
 * @param pre
 * @returns {string}
 */
export function getNextCode(pre = '') {
    return pre + (Date.now() + Math.random().toFixed(3)).replace('.', '')
}

/**
 * 用对象名称获得唯一的编码
 * @param str 源，比如 NickName, AliasName 等
 * @returns {*}
 */
export function getHashCode(str) {
    hash.update(str)
    return hash.digest('hex')
}


export function xtime() {
    return moment().format('YY/M/D H:mm:ss')
}

/**
 * 根据长度截取先使用字符串，超长部分追加…
 * str 对象字符串
 * len 目标字节长度
 * 返回值： 处理结果字符串
 */
export function cutString(str, len) {
    //length属性读出来的汉字长度为1
    if (str.length * 2 <= len) {
        return str
    }
    let strlen = 0
    let s = ""
    for (let i = 0; i < str.length; i++) {
        s = s + str.charAt(i)
        if (str.charCodeAt(i) > 128) {
            strlen = strlen + 2
            if (strlen >= len) {
                return s.substring(0, s.length - 1) + "…"
            }
        } else {
            strlen = strlen + 1
            if (strlen >= len) {
                return s.substring(0, s.length - 2) + "…"
            }
        }
    }
    return s
}


function isNumber(a) {
    return !isNaN(parseFloat(a))
}
