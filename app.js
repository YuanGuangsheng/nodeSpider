'use strict'
const express = require('express')
const path = require('path')
const bodyParser = require('body-parser')
const moment = require('moment')

moment.locale('cn')
import {getNextCode, getHashCode,} from './utils/global'
import Service from './service'

const app = express()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use('/static', express.static(path.resolve(__dirname, 'public')))


app.get('/', async (req, res) => {
    res.send('Hello World!')

    let body = {
        a: 'b'
    }
    let id = getNextCode('t')
    await Service.create('test', body, id)
})

// 生产环境接口

// todo 每个平台一个routes？或者合并，但每个平台有一个爬虫服务
const youku = require('./routes/youku')
app.use('/youku', youku)

const yy = require('./routes/yy')
app.use('/yy', yy)

const fanxing = require('./routes/fanxing')
app.use('/fanxing', fanxing)

const yingke = require('./routes/yingke')
app.use('/yingke', yingke)

const yizhi = require('./routes/yizhi')
app.use('/yizhi', yizhi)

const huajiao = require('./routes/huajiao')
app.use('/huajiao', huajiao)

const meipai = require('./routes/meipai')
app.use('/meipai', meipai)

const douyu = require('./routes/douyu')
app.use('/douyu', douyu)

const xiongmao = require('./routes/xiongmao')
app.use('/xiongmao', xiongmao)

const huya = require('./routes/huya')
app.use('/huya', huya)

const quanmin = require('./routes/quanmin')
app.use('/quanmin', quanmin)

const zhanqi = require('./routes/zhanqi')
app.use('/zhanqi', zhanqi)


// 微信公众号：飞鹏网
const feipeng = require('./routes/feipeng')
app.use('/feipeng', feipeng)

// 游久激活码
const youjiu = require('./routes/youjiu')
app.use('/youjiu', youjiu)

// 英雄小助手
const herohelper = require('./routes/herohelper')
app.use('/herohelper', herohelper)

// 蚕豆网
const candou = require('./routes/candou')
app.use('/candou', candou)

// 起小点见
const qxdjian = require('./routes/qxdjian')
app.use('/qxdjian', qxdjian)

// 上分神奇
const shangfenshenqi = require('./routes/shangfenshenqi')
app.use('/shangfenshenqi', shangfenshenqi)

// LOL
const lol = require('./routes/lol')
app.use('/lol', lol)

// 王者的荣耀神吐槽
const kjjysytch = require('./routes/kjjysytch')
app.use('/kjjysytch', kjjysytch)

// 王者的荣耀专区
const wangzherongyaoa = require('./routes/wangzherongyaoa')
app.use('/wangzherongyaoa', wangzherongyaoa)

// 朵爱
const duoai = require('./routes/duoai')
app.use('/duoai', duoai)

// YY娱乐精选
const mclige = require('./routes/mclige')
app.use('/mclige', mclige)

// YY八卦报道
const yybg79 = require('./routes/yybg79')
app.use('/yybg79', yybg79)

// yy趣闻大揭秘
const yyqw = require('./routes/yyqw')
app.use('/yyqw', yyqw)

//YY热点
const yyredian = require('./routes/yyredian')
app.use('/yyredian', yyredian)

// yy快手情报局
const yyqbj = require('./routes/yyqbj')
app.use('/yyqbj', yyqbj)

// 金鸽传媒
const jingge = require('./routes/jingge')
app.use('/jingge', jingge)

// 灰狼传媒
const huilang = require('./routes/huilang')
app.use('/huilang', huilang)

// 繁星天越传媒
const fxtycm = require('./routes/fxtycm')
app.use('/fxtycm', fxtycm)

// 伽柏传媒
const jiabaichuanmei = require('./routes/jiabaichuanmei')
app.use('/jiabaichuanmei', jiabaichuanmei)

app.listen(3000)
