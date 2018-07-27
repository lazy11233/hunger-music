
var EventCenter = {
    on: function (type, handler) {
        $(document).on(type, handler);
    },
    fire: function (type, data) {
        $(document).trigger(type, data);
    }
}

var Footer = {
    init: function () {
        this.$footer = $("footer");
        this.$ul = this.$footer.find("ul");
        this.$box = this.$footer.find(".box");
        this.rightBtn = this.$footer.find(".icon-right");
        this.leftBtn = this.$footer.find(".icon-left");
        this.isToEnd = false;
        this.isToStart = true;
        this.isAnimate = false;
        this.bind();
        this.getData();
    },
    //绑定事件
    bind: function () {
        var _this = this;
        var itemWidth = _this.$footer.find("li").outerWidth(true);
        var rowCount = Math.floor(_this.$box.width() / itemWidth);
        $(window).on("resize", function () {
            _this.setStyle();
        });
        _this.leftBtn.on("click", function () {
            if (_this.isAnimate) {
                return;
            }
            if (!_this.isToStart) {
                _this.isAnimate = true;
                _this.$ul.animate({
                    left: "+=" + rowCount * itemWidth
                }, 400, function () {
                    if (parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css("right")) >= parseFloat(_this.$ul.width())) {
                        //连续点击，当前页面还没计算好left值，会导致超过
                        _this.isToStart = true;
                    }
                    _this.isAnimate = false;
                });
            }
        });
        _this.rightBtn.on("click", function () {
            if (_this.isAnimate) {
                return;
            }

            if (!_this.isToEnd) {
                _this.isAnimate = true;
                _this.$ul.animate({
                    left: "-=" + rowCount * itemWidth
                }, 400, function () {
                    _this.isToStart = false;
                    if (parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css("left")) >= parseFloat(_this.$ul.width())) {
                        //连续点击，当前页面还没计算好left值，会导致超过
                        _this.isToEnd = true;
                    }
                    _this.isAnimate = false;
                });
            }
        });
        _this.$footer.on("click", "li", function () {
            $(this).addClass("active")
                .siblings().removeClass("active");
            EventCenter.fire("select-albumn", {
                channelId: $(this).attr("data-channel-id"),
                channelName: $(this).attr("data-channel-name")
            });
        });
    },
    //从服务器获取data
    getData: function () {
        var _this = this;
        $.ajax({
            url: "https://api.jirengu.com/fm/getChannels.php",
            dataType: "json",
            success: function (ret) {
                _this.renderFooter(ret);
            },
            error: function (e) {
                console.log("error");
            }
        });
    },
    //渲染footer的内容
    renderFooter: function (data) {
        var _this = this;
        var html = "";
        $(data.channels).each(function (ids, channel) {
            html += "<li data-channel-id='" + channel.channel_id + "' data-channel-name='" + channel.name + "'>"
                + "<div class='cover' style='background-image:url(" + channel.cover_small + ")'></div>"
                + "<h3>" + channel.name + "</h3>"
                + "</li>";
        });
        _this.$footer.find("ul").html(html);
        _this.setStyle();
    },
    //channel内的ul没有设置宽度，li很多就自动换行，所以手动设置下ul的宽度
    setStyle: function () {
        var _this = this;
        var count = _this.$footer.find("li").length;
        var width = _this.$footer.find("li").outerWidth(true);

        _this.$footer.find("ul").css({
            width: count * width + "px",
        })
    }
}

var Fm = {
    init: function () {
        this.$container = $("#page-music");
        this.$bg = $(".bg");
        this.channelId = "";
        this.channelName = "";
        this.song = "";
        this.audio = new Audio();
        this.audio.autoplay = true;
        this.statusClock = "";
        this.bind();
        this.start();
    },
    bind: function () {
        var _this = this;
        EventCenter.on("select-albumn", function (e, channel) {
            _this.channelId = channel.channelId;
            _this.channelName = channel.channelName;
            _this.loadMusic(function () {
                _this.setMusic();
            });
        });

        _this.$container.find(".btn-play").on("click", function () {
            var $btn = $(this);
            if ($btn.hasClass("icon-play")) {
                $btn.removeClass("icon-play").addClass("icon-pause");
                _this.audio.play();
            } else {
                $btn.removeClass("icon-pause").addClass("icon-play");
                _this.audio.pause();
            }
        });
        _this.$container.find(".btn-next").on("click", function () {
            _this.loadMusic();
        });
        _this.audio.addEventListener("play", function () {
            clearInterval(_this.statusClock);
            _this.statusClock = setInterval(function () {
                _this.updateStatus();
            }, 1000);
        });
        _this.audio.addEventListener("pause", function () {
            clearInterval(_this.statusClock);
        });
        _this.$container.find(".bar").on("click", function (e) {
            var percent = e.offsetX / _this.$container.find(".bar").width();
            _this.audio.currentTime = _this.audio.duration * percent;
        });
        _this.$container.find(".aside .btn-collect").on("click", function () {
            if ($(this).hasClass("icon-love")) {
                $(this).removeClass("icon-love").addClass("icon-xin");
            } else {
                $(this).removeClass("icon-xin").addClass("icon-love");
            }
        });
    },
    loadMusic: function () {
        var _this = this;
        $.ajax({
            url: "https://jirenguapi.applinzi.com/fm/getSong.php",
            type: "GET",
            dataType: "JSON",
            data: {
                channel: _this.channelId,
            },
            success: function (ret) {
                _this.song = ret["song"][0];
                _this.setMusic();
                _this.loadLyric();
            },
            error: function () {
                console.log("error");
            }
        });
    },
    loadLyric: function () {
        var _this = this;
        $.ajax({
            url: "https://jirenguapi.applinzi.com/fm/getLyric.php",
            type: "GET",
            dataType: "JSON",
            data: {
                sid: _this.song.sid
            },
            success: function (ret) {
                var lyric = ret.lyric;
                var lyricObj = {};
                lyric.split("\n").forEach(function (line) {
                    var times = line.match(/\d{2}:\d{2}/g);
                    //time == [01:10.25,01:20.35] 
                    var str = line.replace(/\[.+?\]/g, "");
                    if (Array.isArray(times)) {
                        times.forEach(function (time) {
                            lyricObj[time] = str;
                        });
                    }
                });
                _this.lyricObj = lyricObj;
            }
        });
    },
    setMusic: function () {
        var _this = this;
        console.log(_this.song);
        _this.audio.src = _this.song.url;
        _this.$bg.css("background-image", "url(" + _this.song.picture + ")");
        _this.$container.find("figure").css("background-image", "url(" + _this.song.picture + ")");
        _this.$container.find(".author").text(_this.song.artist);
        _this.$container.find(".detail h1").text(_this.song.title);
        _this.$container.find(".tag").text(_this.channelName);
        _this.$container.find(".btn-play").removeClass("icon-play").addClass("icon-pause");
    },
    updateStatus: function () {
        //1.显示进度条和其他信息
        var _this = this;
        var min = Math.floor(_this.audio.currentTime / 60);
        var sec = Math.floor(_this.audio.currentTime % 60);
        sec = sec > 10 ? "" + sec : "0" + sec;
        _this.$container.find(".current-time").text("0" + min + ":" + sec);
        var percent = _this.audio.currentTime / _this.audio.duration;
        _this.$container.find(".bar-progress").css("width", percent * 100 + "%");
        //2.显示对应歌词
        if(_this.lyricObj){
            var line = _this.lyricObj["0" + min + ":" + sec];
            if (line) {
                _this.$container.find(".lyric p").text(line).boomText();
            }
        }else{
            _this.$container.find(".lyric p").text("暂无歌词");
        }
    },
    start: function () {
        var _this = this;
        $("footer li").eq(0).trigger("click");
    }
}

$.fn.boomText = function (type) {
    type = type || 'rollIn';
    this.html(function () {
        var arr = $(this).text()
            .split('').map(function (word) {
                return '<span class="boomText">' + word + '</span>';
            })
        return arr.join('');
    })

    var index = 0;
    var $boomTexts = $(this).find('span');
    var clock = setInterval(function () {
        $boomTexts.eq(index).addClass('animated ' + type);
        index++
        if (index >= $boomTexts.length) {
            clearInterval(clock);
        }
    }, 300)
}

Footer.init();
Fm.init();
