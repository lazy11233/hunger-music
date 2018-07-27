# 自制音乐电台

## 功能介绍
* 音乐控制台，播放和暂停功能
* 进度条和时间动态显示
* 背景图片跟随歌曲改变，自动填充
* 点击进度条，歌曲进度也会改变
* 收藏功能
* 歌词炫酷的显示效果
* 不同种电台切换

## 技术细节介绍
* 页面采用响应式布局，没有使用传统的` px `作为我们的长度单位，而是选在` vh `，这样解决了在屏幕缩小后页面内容等比缩小；
* 页面的布局，使用了flex，这里的知识点不是很熟，调试多次才有效果；
* ` footer `部分的布局和调整，使用绝对定位加上浮动，绝对定位的左右按钮没有设置参考点没考虑好；
* ` footer `中的左右移动逻辑判断，参数容易混淆，判断的方式思考僵化，最后考虑父元素的宽度即可；
* 播放功能事件监听` audio.play `而不是` timeupdate `
* 歌词的展示，开始判断` audio.currentTime `是否等于每一行的时间再显示，没想到` var line = _this.lyricObj["0" + min + ":" + sec]; `；

## 项目的收获
* 学会自适应布局和屏幕大小变化的调整
* 熟练了音乐API
* ajax的使用
* 学会了自定义事件监听
```javascript
var EventCenter = {
    on: function (type, handler) {
        $(document).on(type, handler);
    },
    fire: function (type, data) {
        $(document).trigger(type, data);
    }
}
```
* 歌词的展示和数组的运用

## 技术栈
 **jQuery**、**ajax**、**响应式**、**CSS3+HTML5**
