const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
// const crypto = require('crypto')

const moment = require('moment')
moment.locale('cn')
const debug = require('debug')('api')

const superagent = require('superagent')
const cheerio = require('cheerio')
const mysql = require('mysql')
import Service from '../service'


const router = express.Router()
//获取一直播热门列表(fill_num:从第多少个开始    limit：加载多少个)
router.get('/hotList/:fill_num/:limit', (req, res) => {
  const result = res
  let fill_num = req.params.fill_num
  let limit = req.params.limit
  superagent
      .post('http://new.yizhibo.com/www/web/get_pc_hot_list_more')
      .type('form')
      .send({'fill_num':fill_num,'limit':limit})
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let array=JSON.parse(res.text).data
        let mess=[];
        for(let i=0;i<array.length;i++){
          mess.push({'memberid':array[i].memberid,'online':array[i].online,'scid':array[i].scid})
        }
        result.send(mess)
      })
})
//根据memberid,获取主播的详细信息
router.get('/message/:memberid', (req, res) => {
  const result = res
  let memberid = req.params.memberid
  superagent
      .get('http://new.yizhibo.com/member/h5api/get_member_info_for_live?memberid='+memberid+'&anchormemberid='+memberid)
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let array=JSON.parse(res.text).data
        let name=array.nickname
        let avatar=array.avatar
        let slogan=array.desc
        let id=array.memberid
        let tab=array.ytypename
        let fansNum=array.fanstotal
        let goldCoin=array.receive_goldcoin
        result.send({'name':name,'avatar':avatar,'slogan':slogan,'id':id,'tab':tab,'fansNum':fansNum,'goldCoin':goldCoin})
      })
})
//根据memberid,获取主播的照片
router.get('/photos/:memberid', (req, res) => {
  const result = res
  let memberid = req.params.memberid
  superagent
      .get('http://new.yizhibo.com/member/personel/user_photos?memberid='+memberid)
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        const $ = cheerio.load(res.text)
        let photos=[]
        $('.index_all_common').each(function(idx,element){
          let $element=$(element)
          let photoSrc=$element.find('.index_img').children('img').attr('src');
          let photoTitle=$element.find('.index_intro').text().trim();
          photos.push({"photoSrc":photoSrc,"photoTitle":photoTitle})
        })
        result.send(photos)
      })
})
//直播场榜
router.get('/fieldList/:scid', (req, res) => {
  const result = res
  let scid = req.params.scid
  superagent
      .get('http://new.yizhibo.com/gift/h5api/get_single_list?scid='+scid)
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let array=JSON.parse(res.text).data.list
        result.send(array)
      })
})
//直播总榜
router.get('/totalList/:memberid/:num', (req, res) => {
  const result = res
  let memberid = req.params.memberid
  let num = req.params.num
  superagent
      .get('http://new.yizhibo.com/gift/h5api/get_watch_members?memberid='+memberid+'&limit='+num)
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let array=JSON.parse(res.text).data.list
        result.send(array)
      })
})
//直播观众
router.get('/viewersList/:scid', (req, res) => {
  const result = res
  let scid = req.params.scid
  superagent
      .get('http://new.yizhibo.com/live/h5api/get_live_online_members?scid='+scid)
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let array=JSON.parse(res.text).data
        result.send(array)
      })
})
//礼物暂时找不到
module.exports = router