var request = require('request');
var async = require('async');
var cheerio = require('cheerio');
var superagent = require('superagent')
var fs = require('fs')
const crypto = require('crypto')
var Ut = {};

/**
 * 用对象名称获得唯一的编码
 * @param str 源，比如 NickName, AliasName 等
 * @returns {*}
 */
function getHashCode(str) {
  const hash = crypto.createHash('md5')
  hash.update(str)
  return hash.digest('hex')
}
/**
根据微信号搜索公众号,并获取搜素到的第一个公众号链接
@param {string} public_num 微信号
@param {function} callback 回调函数,callback(null,url)
*/
Ut.search_wechat = function (public_num, callback) {
  var encode_public_num = encodeURIComponent(public_num);
  var url = `http://weixin.sogou.com/weixin?type=1&query=${encode_public_num}&ie=utf8&_sug_=y&_sug_type_=1`;
  request(url, function (err, response, html) {
    if (err) return callback(err, null);
    if (html.indexOf('<title>302 Found</title>') != -1) return callback(null, '302');
    if (html.indexOf('您的访问过于频繁') != -1) return callback('-访问过于频繁')
    var $ = cheerio.load(html);
    //公众号页面的临时url
    var wechat_num = $($("#sogou_vr_11002301_box_0 a")[0]).attr('href') || '';
    setTimeout(function () {
      callback(null, wechat_num.replace(/amp;/g, ''));
    }, 1000 + Math.ceil(Math.random() * 500));
  })
};

/**
获取最近10条图文信息列表
@param {string} url 根据search_wechat方法得到的公众号链接
@param {function} callback 回调函数,callback(null, article_titles, article_urls, article_pub_times)
*/
Ut.look_wechat_by_url = function (url, callback) {
  var task3 = [];
  //发布时间数组
  var article_pub_times = [];
  //标题列表数组
  var article_titles = [];
  //文章临时url列表数组
  var article_urls = [];

  var article_con = [];
      request(url, function (err, response, html) {
    if (err) return callback(err, null, null);
    var task4 = [];
    if (html.indexOf('为了保护你的网络安全，请输入验证码') != -1) {
      //验证验证码
      task4.push(function (callback) {
        Ut.solve_verifycode(html, url, function (err, result) {
          if (err) return callback(err, null);
          callback(null, result);
        })
      });
    } else {
      task4.push(function (callback) {
        callback(null, html);
      });
    }
    task4.push(function (html, callback) {
      //文章数组,页面上是没有的,在js中,通过正则截取出来
      var msglist = html.match(/var msgList = ({.+}}]});?/);
      if (!msglist) return callback(`-没有搜索到 ${publicNum} 的文章,只支持订阅号,服务号不支持!`);
      msglist = msglist[1];
      msglist = msglist.replace(/(&quot;)/g, '\\\"').replace(/(&nbsp;)/g, '');
      msglist = JSON.parse(msglist);
      if (msglist.list.length == 0) return callback(`-没有搜索到 ${publicNum} 的文章,只支持订阅号,服务号不支持!`);

      //循环文章数组,重组数据
      msglist.list.forEach(function (msg, index) {
        //基本信息,主要是发布时间
        var article_info = msg.comm_msg_info;
        //发布时间
        var article_pub_time = Ut.fmtDate(new Date(article_info.datetime * 1000)).split(" ")[0];
        //第一篇文章
        var article_first = msg.app_msg_ext_info;
        article_pub_times.push(article_pub_time);
        article_titles.push(article_first.title);
        article_urls.push('http://mp.weixin.qq.com' + article_first.content_url.replace(/(amp;)|(\\)/g, ''));
        if (article_first.multi_app_msg_item_list.length > 0) {
          //其他文章
          var article_others = article_first.multi_app_msg_item_list;
          article_others.forEach(function (article_other, index) {
            article_pub_times.push(article_pub_time);
            article_titles.push(article_other.title);
            article_urls.push('http://mp.weixin.qq.com' + article_other.content_url.replace(/(amp;)|(\\)/g, ''));
          })
        }
      })
      callback(null);
    })
    async.waterfall(task4, function (err, result) {
      if (err) return callback(err);
      setTimeout(function () {
        callback(null, article_titles, article_urls, article_pub_times);
      }, 1000 + Math.ceil(Math.random() * 500));
    })
  })
};

/**
根据图文url获取详细信息,发布日期,作者,公众号,阅读量,点赞量等
@param {array} article_titles 所有标题数组
@param {array} article_urls 所有文章临时url数组
@param {array} article_pub_times 所有发布时间数组
@param {function} callback 回调函数,callback(null, articles);
*/
Ut.get_info_by_url = function (public_num,article_titles, article_urls, article_pub_times, callback) {
  var task1 = [];
  var articles = [];
  var imgPath = getHashCode(public_num); // md5文件夹名称
  // 创建文件夹
  fs.exists('images/'+imgPath, function (exists) {
     if(exists){
       // 文件夹存在，不做任何操作
     }else{
       // 文件夹不存在，创建文件夹
       fs.mkdirSync('images/'+imgPath);
     }
  });

  if (article_urls.length > 0) {
    article_urls.forEach(function (article_url, index) {
      //此if可以限制获取文章的数量.为了测试,限制抓取几篇
      if (index < 2) {
        task1.push(function (callback) {
          var article_object = {
            title: '', url: '', read_num: '', like_num: '',
            release_time: '', author: '', wechat_number: '', content: ''
          }
          var task2 = [];
          //发布日期,作者,公众号,url,文章内容
          task2.push(function (callback) {
            request(article_url, function (err, response, html) {
              if (err) return callback(err, null);
              var $ = cheerio.load(html);
              //发布日期
              var release_time = $("#post-date").text();
              //作者
              var author = $($(".rich_media_meta_list em")[1]).text();
              // 文章内容
              var content = "";
              var con = "";
              var src = "";
              var suffix = "";
              var picName = "";
              switch (public_num) // 剩一个“游戏研究院”(没有内容)
              {
                case "飞鹏网": // 杂项不一致
                  {
                    con = currency($, imgPath);
                    con = unescape(con.replace(/&#x/g,'%u').replace(/;/g,''));
                    if(con.match("分割线")&&con.match("推荐阅读")){
                      content = "<p>" + con.match(/(title="分割线").*?(?=推荐阅读)/g) + "</p>"
                    }else if(con.match("分割线")&&con.match("今日动图")){
                      content = "<p>" + con.match(/(title="分割线").*?(?=今日动图)/g) + "</p>"
                    }else{
                      content = con
                    }
                    break;
                  }
                case "游久激活码":
                  {
                    con = youjiu($,imgPath);
                    if(con.match("14876066b29b1d828af56ab38e084c09.gif")){
                      content = con.match(/.*?(?=14876066b29b1d828af56ab38e084c09.gif)/g)
                    }else if(con.match("今日话题")){
                      content = con.match(/.*?(?=今日话题)/g)
                    }else{
                      content = con
                    }
                   //content = con
                    break;
                  }
                case "英雄小助手":
                  {
                    content = currency($,imgPath)
                    // 杂项无规则可寻，没去除
                    break;
                  }
                case "蚕豆网": // 去的不好
                  {
                    con = currency($,imgPath)
                    con = unescape(con.replace(/&#x/g,'%u').replace(/;/g,''));
                    if(con.match("泛娱乐圈娱乐八卦公众号")&&con.match("壹品健康")) {
                      content = con.match(/(497318841).*?(?=http:\/\/mmbiz.qpic.cn\/mmbiz\/Z09530A9ZoHbdicG9la6wwEOgAaCPqibunuW9YNibibvnfKMvl7fP9PWI13F0maIJqmUhoribBA5Ws8o13wuiaAZBnMA\/640)/g)
                    }else{
                      content = con
                    }
                    break;
                  }
                case "起小点见":
                  {
                    con = currency($,imgPath)
                    // 去除文章杂项
                    var len = $(con).length;
                    $(con).each(function(idx, element){
                      if(idx<1) { // 去掉头部的gif图，底部无规律
                        $(this).remove()
                      }else{
                        content += $(this);
                      }
                    })
                    break;
                  }
                case "上分神器":
                  {
                    con = shangfen($,imgPath)
                    // 去除文章杂项
                    $(con).each(function(idx, element) {
                      if($(this).html().match('class="__bg_gif"')){ // 去除顶部gif图
                        $(this).remove()
                      }
                    })
                    if(con.match("<hr>")) { // 去除<hr>之后的广告内容
                      var ad = con.match(/(<hr>).*/g);
                      content = con.replace(ad,"")
                    }else{
                      content = con;
                    }
                    break;
                  }
                case "LOL":
                  {
                    con = currency($,imgPath)
                    if(con.match('<strong style="text-align: center')){ // 去掉最后面的广告
                      var ad = con.match(/(<strong style="text-align: center).*/g);
                      content = con.replace(ad,"")+"</p>"
                    }
                    break;
                  }
                case "王者的荣耀神吐槽": // 视频
                  {
                    content = video($)
                    break;
                  }
                case "王者的荣耀专区": // 底部广告没去
                  {
                    con = currency($,imgPath)
                    if($(con).eq(0).html().match("bdfa3f96109c8e424d9a099ef386b70")){ // 去掉顶部gif图
                      content = con.replace($(con).eq(0).html(),"");
                    }else{
                      content = con;
                    }
                    break;
                  }
                case "YY娱乐精选": // 视频
                  {
                    content = video($)
                    break;
                  }
                case "YY八卦报道": //没广告
                  {
                    content = currency($,imgPath)
                    break;
                  }
                case "YY趣闻大揭秘":
                  {
                    content = currency($,imgPath)
                    break;
                  }
                case "YY热点": // 八百年不更新数据，没有杂项
                  {
                    content = currency($,imgPath)
                    break;
                  }
                case "金鸽传媒": // 貌似没有杂项
                  {
                    content = currency($,imgPath)
                    break;
                  }
                case "灰狼传媒":
                  {
                    con = currency($,imgPath)
                    // 去除文章杂项
                    $(con).each(function(idx, element) {
                      if(idx<1) {
                        $(this).remove()
                      }else {
                        content += $(this)
                      }
                    })
                    if(content.match('MwDO7ZY5FUn7SNmicd4s9rq0TZ684RUNibHDgChAiaK5T420JkHloYYutKCuDOjWiaYWnlbgv9SfJUWJGuKZtvDKyw')){ // 去除底部杂项
                      var ad = content.match(/(<img class="" data-ratio="0.5484375" data-s="300,640" data-src="http:\/\/mmbiz.qpic.cn\/mmbiz_jpg\/MwDO7ZY5FUn7SNmicd4s9rq0TZ684RUNibHDgChAiaK5T420JkHloYYutKCuDOjWiaYWnlbgv9SfJUWJGuKZtvDKyw\/640\?wx_fmt=jpeg).*/g);
                      content = content.replace(ad,"")+"</strong></p>"
                    }
                    break;
                  }
                case "繁星天越传媒": // 需要重新获取
                  {
                    con = tianyue($,imgPath)
                    if(con.match("85b8cfc8cdd000434b509b7f1f40057b")&&con.match("http:\/\/mmbiz.qpic.cn\/mmbiz_jpg\/8USEL8uT9NI7BcjUSxmiaoqMrqjJE3HlFMia5nicfAmj1ZCC4WZ9fI1ibrYpmcC8ZgDwYpTNluw0CIgHL5A3iavUSJQ")){
                      content = con.match(/(85b8cfc8cdd000434b509b7f1f40057b).*?(?=http:\/\/mmbiz.qpic.cn\/mmbiz_jpg\/8USEL8uT9NI7BcjUSxmiaoqMrqjJE3HlFMia5nicfAmj1ZCC4WZ9fI1ibrYpmcC8ZgDwYpTNluw0CIgHL5A3iavUSJQ)/g)
                    }else if(con.match("85b8cfc8cdd000434b509b7f1f40057b")&&con.match("f4035428dc53e3bb21394920c66af5dd")){
                      content = con.match(/(85b8cfc8cdd000434b509b7f1f40057b).*?(?=f4035428dc53e3bb21394920c66af5dd)/g)
                    }else{
                      content = con
                    }
                    break;
                  }
                case "朵爱": // 暂时放弃
                  {
                    content = duoai($,imgPath)
                    break;
                  }
                case "YY快手情报局": // 目测暂时无杂项
                  {
                    content = qingbaoju($,imgPath)
                    break;
                  }
                case "伽柏传媒":
                  {
                    content = shangfen($,imgPath)
                    break;
                  }
              }


              //content = unescape(content.replace(/&#x/g,'%u').replace(/;/g,''));
              //公众号
              var wechat_number = $("#post-user").text();
              article_object.release_time = release_time;
              article_object.author = author;
              article_object.wechat_number = wechat_number;
              article_object.title = article_titles[index].replace(/amp;/g, '').replace(/&quot;/g, '"');
              article_object.url = article_urls[index];
              article_object.content = content;
              callback(null, article_url);
            })
          })
          //阅读量和点赞量,ajax获取
          task2.push(function (article_url, callback) {
            var ajax_url = article_url.replace(/\/s\?/, '/mp/getcomment?');
            var options = {
              url: ajax_url,
              json: true,
              method: 'GET'
            };
            Ut.request_json(options, function (err, data) {
              if (err) {
                //console.log(err)
                article_object.read_num = 0;
                article_object.like_num = 0;
                return callback(null, article_url);
              }
              article_object.read_num = data.read_num;
              article_object.like_num = data.like_num;
              callback(null, article_url);
            })
          })
          task2.push(function (article_url, callback) {
            var suffix_url = `&devicetype=Windows-QQBrowser&version=61030004&pass_ticket=qMx7ntinAtmqhVn+C23mCuwc9ZRyUp20kIusGgbFLi0=&uin=MTc1MDA1NjU1&ascene=1`;
            var get_forever_url = article_url + suffix_url;
            var options = {
              url: get_forever_url,
              headers: {
                'User-Agent': 'request'
              }
            };
            request(options, function (error, response, body) {
              if (!error && response.statusCode == 200) {
                article_object.url = response.request.href;
              }
              callback(null);
            });
          })
          async.waterfall(task2, function (err, result) {
            if (err) return callback(err, null);
            articles.push(article_object);
            setTimeout(function () {
              callback(null);
            }, 500 + Math.ceil(Math.random() * 500));
          })

        })
      }
    })
  }
  async.waterfall(task1, function (err, result) {
    if (err) return callback(err, null);
    callback(null, articles);
  })
};

/**
通过第三方接口,解决搜狗微信验证码
@param {string} html ,从html获取验证码等信息
@param {string} url  ,验证成功后重新访问的url即公众号链接
*/
Ut.solve_verifycode = function (html, url, callback) {
  console.log('识别验证码');
  var code_cookie = '';
  var cert = '';
  var task_code = [];
  //获取base64格式的验证码图片
  task_code.push(function (callback) {
    var $ = cheerio.load(html);
    var img_url = 'http://mp.weixin.qq.com' + $("#verify_img").attr('src');
    img_url = `http://mp.weixin.qq.com/mp/verifycode?cert=${(new Date).getTime() + Math.random()}`
    cert = img_url.split('=')[1];
    var j = request.jar();
    request.get({ url: img_url, encoding: 'base64', jar: j }, function (err, response, body) {
      if (err) return callback(err);
      var cookie_string = j.getCookieString(img_url);
      code_cookie = cookie_string;
      callback(null, body);
    })
  })
  //通过第三方接口识别验证码,并返回
  task_code.push(function (base64, callback) {
    var form = {
      img_base64: base64,
      typeId: 2040
    }
    var opts = {
      url: 'http://ali-checkcode.showapi.com/checkcode',
      method: 'POST',
      formData: form,
      json: true,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        //授权码
        "Authorization": "48ccfb72a3634a2f999825bcce4b982f" // 自己的AppCode
      }
    };
    Ut.request_json(opts, function (err, data) {
      if (err) return callback(err);
      if (data.showapi_res_code == 0) {
        callback(null, data.showapi_res_body.Result);
      }
    })
  });
  //验证验证码是否正确
  task_code.push(function (verifycode, callback) {
    var verifycode_url = `http://mp.weixin.qq.com/mp/verifycode?cert=${encodeURIComponent(cert)}&input=${encodeURIComponent(verifycode)}`;
    var form = {
      input: encodeURIComponent(verifycode),
      cert: encodeURIComponent(cert)
    }
    var options = {
      url: verifycode_url,
      json: true,
      formData: form,
      method: 'post',
      headers: { "Cookie": code_cookie }
    };
    Ut.request_json(options, function (err, data) {
      if (err) return callback(err);
      console.log('验证码识别成功')
      callback(null);
    })
  })
  //验证码正确重新访问
  task_code.push(function (callback) {
    request(url, function (err, response, html) {
      if (err) return callback(err, null);
      //搜狗微信的验证码即使输入成功,有的时候也需要输入几次验证码,所以重复调用solve_verifycode方法
      if (html.indexOf('为了保护你的网络安全，请输入验证码') != -1) {
        return Ut.solve_verifycode(html, url, callback);
      }
      callback(null, html);
    })
  })
  async.waterfall(task_code, function (err, result) {
    if (err) return callback(err, null);
    callback(null, result);
  })
};


/**
request的ajax获取方法,某些网站反爬,可以自定义头部
  var options = {
    url: url,
    json:true,
    method : 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 
       (KHTML, like Gecko) Chrome/54.0.2840.87 Safari/537.36',
      'X-Requested-With':'XMLHttpRequest'
    }
  };
*/
Ut.request_json = function (options, callback) {
  request(options, function (error, response, body) {
    if (error) return callback(error, null);
    if (response.statusCode != 200) return callback("statusCode" + response.statusCode, null);
    callback(null, body);
  });
};

/**
格式化时间
*/
Ut.fmtDate = function (date) {
  // 将数字格式化为两位长度的字符串
  var fmtTwo = function (number) {
    return (number < 10 ? '0' : '') + number;
  };
  var yyyy = date.getFullYear();
  var MM = fmtTwo(date.getMonth() + 1);
  var dd = fmtTwo(date.getDate());
  var HH = fmtTwo(date.getHours());
  var mm = fmtTwo(date.getMinutes());
  var ss = fmtTwo(date.getSeconds());
  return '' + yyyy + '-' + MM + '-' + dd + ' ' + HH + ':' + mm + ':' + ss;
}

module.exports = Ut;

// 游久激活码
function youjiu($,imgPath) {
  var content = "";
  $("#js_content section p").each(function(idx, element) {
    if($(this).html().match("<img")){
      var src = $(this).children().attr('data-src');
      var suffix = String(src.match(/(\?wx_fmt=).*/g)).replace('?wx_fmt=',''); // 图片格式.png .jpeg .gif 等
      var picName = getHashCode(src); // 用于md5图片名称
      // 将图片存入本地
      superagent
          .get(src)
          .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36')
          .pipe(fs.createWriteStream('./images/' + imgPath +'/'+ picName +'.'+suffix));
      $(this).html('<img src="../images/' + imgPath +'/'+ picName +'.'+ suffix +'"/>')
    }
    content += $(this);
  })
  return content;
}

// 视频
function video($){
  var content = ""
  $("#js_content").children().each(function(idx, element) {
    content += $(this);
  })
  return content;
}

// 朵爱
function duoai($,imgPath){
  var content = "";
  $("#js_content blockquote p").each(function(idx, element) {
    if($(this).html().match("<img")){
      var src = $(this).children().attr('data-src');
      var suffix = String(src.match(/(\?wx_fmt=).*/g)).replace('?wx_fmt=',''); // 图片格式.png .jpeg .gif 等
      if(suffix == "null"){
        $(this).remove();
      }else {
        var picName = getHashCode(src); // 用于md5图片名称
        // 将图片存入本地
        superagent
            .get(src)
            .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36')
            .pipe(fs.createWriteStream('./images/' + imgPath + '/' + picName + '.' + suffix));
        $(this).html('<img src="../images/' + imgPath + '/' + picName + '.' + suffix + '"/>')
      }
    }
    content += $(this);
    })
  return content;
}

// YY快手情报局,伽柏传媒
function qingbaoju($,imgPath) {
  var content = "";
  $("#js_content p").each(function(idx, element) {
    if($(this).html().match("<img")){
      var src = $(this).children().attr('data-src');
      var suffix = String(src.match(/(\?wx_fmt=).*/g)).replace('?wx_fmt=',''); // 图片格式.png .jpeg .gif 等
      var picName = getHashCode(src); // 用于md5图片名称
      // 将图片存入本地
      superagent
          .get(src)
          .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36')
          .pipe(fs.createWriteStream('./images/' + imgPath +'/'+ picName +'.'+suffix));
      $(this).html('<img src="../images/' + imgPath +'/'+ picName +'.'+ suffix +'"/>')
    }
    content += $(this);
  })
  return content;
}

// 繁星天越传媒
function tianyue($,imgPath){
  var content = "";
  var src = "";
  var suffix = "";
  $("#js_content p").each(function(idx, element) {
    // 保存图片
    if($(this).html().match("<img")){
      src = $(this).children().attr('data-src');
      if(src == undefined) {
        $(this).remove();
      }else {
        suffix = String(src.match(/(\?wx_fmt=).*/g)).replace('?wx_fmt=',''); // 图片格式.png .jpeg .gif 等
        if(suffix == "null" || suffix == undefined){
          $(this).remove();
        }else {
          var picName = getHashCode(src); // 用于md5图片名称
          // 将图片存入本地
          superagent
              .get(src)
              .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36')
              .pipe(fs.createWriteStream('./images/' + imgPath + '/' + picName + '.' + suffix));
          var txt = $(this).text()
          $(this).html('<img src="../images/' + imgPath + '/' + picName + '.' + suffix + '"/>' + txt)
        }
      }
    }
    // 文章内容
    content += $(this);
  })
  return content;
}

// 上分神器
function shangfen($,imgPath){
  var content = "";
  var src = "";
  var suffix = "";
  $("#js_content").children().each(function(idx, element) {
    // 保存图片
    if($(this).html().match("<img")){
      src = $(this).children().attr('data-src');
      if(src == undefined) {
        $(this).remove();
      }else {
        suffix = String(src.match(/(\?wx_fmt=).*/g)).replace('?wx_fmt=',''); // 图片格式.png .jpeg .gif 等
        if(suffix == "null" || suffix == undefined){
          $(this).remove();
        }else {
          var picName = getHashCode(src); // 用于md5图片名称
          // 将图片存入本地
          superagent
              .get(src)
              .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36')
              .pipe(fs.createWriteStream('./images/' + imgPath + '/' + picName + '.' + suffix));
          $(this).html('<img src="../images/' + imgPath + '/' + picName + '.' + suffix + '"/>')
        }
      }
    }
    // 文章内容
    content += $(this);
  })
  return content;
}

// 大部分通用
function currency($,imgPath){
  var content = "";
  var src = "";
  var suffix = "";
  $("#js_content p").each(function(idx, element) {
    // 保存图片
    if($(this).html().match("<img")){
      src = $(this).children().attr('data-src');
      if(src == undefined) {
        $(this).remove();
      }else {
        suffix = String(src.match(/(\?wx_fmt=).*/g)).replace('?wx_fmt=',''); // 图片格式.png .jpeg .gif 等
        if(suffix == "null" || suffix == undefined){
          $(this).remove();
        }else {
          var picName = getHashCode(src); // 用于md5图片名称
          // 将图片存入本地
          superagent
              .get(src)
              .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.101 Safari/537.36')
              .pipe(fs.createWriteStream('./images/' + imgPath + '/' + picName + '.' + suffix));
          $(this).html('<img src="../images/' + imgPath + '/' + picName + '.' + suffix + '"/>')
        }
      }
    }
    // 文章内容
    content += $(this);
  })
  return content;
}