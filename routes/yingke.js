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

//hotlive_list 获取热门播单列表
router.get('/hotList/:page', (req, res) => {
  const result = res
  let page = req.params.page
  superagent
      .get('http://www.inke.cn/hotlive_list.html?page='+page)
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        const $ = cheerio.load(res.text)
        let items=[]
        $('.list_pic').each(function(idx,element){
          let $element=$(element)
          let href=$element.children('a').attr("href")
          let regExpUid = /\?uid=(\d+)/
          let regExpId = /\&id=(\d+)/
          let uid=regExpUid.exec(href)[1]
          let id=regExpId.exec(href)[1]
          let tags=''
          $element.next().next().find("a").text(function(idx,oldcon){
            tags=tags+oldcon+' ';
          })
          items.push({"uid":uid,"id":id,'tags':tags})
        })
        result.send(items)
      })
})
//根据uid和id 获取主播详情页
router.get('/message/:uid/:id', (req, res) => {
  const result = res
  let uid = req.params.uid
  let id = req.params.id
  superagent
      .get('http://webapi.busi.inke.cn/web/live_share_pc?uid='+uid+'&id='+id)
      .end(function(err,res){
        if(err){
          console.error(err)
        }
        let array=JSON.parse(res.text).data.media_info
        let online_users=JSON.parse(res.text).data.file.online_users
        let name=array.nick
        let cover=array.portrait
        let addr=array.area
        let slogan=array.description
        let roomid=array.inke_id
        let sex=array.gender?'男':'女'
        let info={'name':name,'cover':cover,'addr':addr,'slogan':slogan,'roomid':roomid,'sex':sex,'online_users':online_users}
        result.send(info)
      })
})
//无动态数据可以获取
module.exports = router