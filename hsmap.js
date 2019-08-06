(function () {
   var HSMap = function HSMap(){
        // 依赖函数的参数，是属于模块内部
        var hsMap = this;
        // point List
        hsMap._pointList = [];

        // 监听列表
        hsMap._listeners = [];

        hsMap._map = null;

        /**
         * 地图对象
         */
        hsMap.Map = function(canvasId, initData){

            var  _map = this;

            _map.canvas = document.getElementById(canvasId);
            _map.backgroundContext = _map.canvas.getContext('2d');
            _map.pointContext = _map.canvas.getContext('2d');
            _map.lineContext = _map.canvas.getContext('2d');

            _map.standardX = 1; // 图片的宽度/canvas画布宽度
            _map.standardY = 1; // 图片的高度度/canvas画布高度

            _map.canvas.width = initData.width * 2;
            _map.canvas.height = initData.height * 2;

            _map.scaleStep= 1.2;
            _map.imageScale= 1;
            _map._mapPhoto = initData.img;
            _map.imgX = 0;
            _map.imgY = 0;
            _map.img = new Image();

            _map.isDrag = initData.isDrag;


            /**
             * 加载图片地图
             */
            _map.loadImg = function () {
                _map.img.src = _map._mapPhoto;
                _map.img.onload=function () {
                    // 计算 图片 被放大了多少倍
                    _map.standardX = _map.canvas.width/_map.img.width;
                    _map.standardY = _map.canvas.height/_map.img.height;
                    _map.drawImage()
                }
            };


            /**
             * 画图片地图
             */
            _map.drawImage = function () {

                _map.backgroundContext.clearRect(0, 0, _map.canvas.width, _map.canvas.height);
                // _map.pointContext.clearRect(0, 0, _map.canvas.width, _map.canvas.height);

                _map.backgroundContext.drawImage(
                    _map.img, //规定要使用的图像、画布或视频。
                    0, 0, //开始剪切的 x 坐标位置。
                    _map.img.width, _map.img.height,  //被剪切图像的高度。
                    _map.imgX  * _map.imageScale, _map.imgY *  _map.imageScale,//在画布上放置图像的 x 、y坐标位置。
                    _map.canvas.width * _map.imageScale,  _map.canvas.height * _map.imageScale  //要使用的图像的宽度、高度
                );
                // 绘制点
                _map.drawPoints();
            };

            /**
             * 绘制点
             */
            _map.drawPoints = function(){

                for(var i in _map._pointList){
                    var point = _map._pointList[i];
                    var _pointCanvasPos = _map._convertLocationToCanvas(point.x, point.y, point.postionImg.width/2, point.postionImg.height);
                    if(point.bottom){
                        _map._drawPointBottom(point);
                    }
                    _map.pointContext.drawImage(
                        point.postionImg, // 规定要使用的图像、画布或视频。
                        0, 0, // 开始剪切的 x 坐标位置。
                        point.postionImg.width, point.postionImg.height,  // 被剪切图像的高度。
                        _pointCanvasPos.x,
                        _pointCanvasPos.y,// 在画布上放置图像的x,y的位置
                        point.postionImg.width*_map.imageScale, point.postionImg.height * _map.imageScale
                    );
                }
            };

            /**
             * 绘制点底部椭圆
             */
            _map._drawPointBottom = function(point){
                var _pointCanvasPos = _map._convertLocationToCanvas(point.x, point.y, 0, 0);

                _map.drawBottomElllipse(_pointCanvasPos.x, _pointCanvasPos.y, point.bottom.x, point.bottom.y, point.bottom.color);

            }

            _map.drawBottomElllipse=function(x, y, eX, eY, color){
                // 判断IE
                if(!!window.ActiveXObject || "ActiveXObject" in window){
                    _map.drawElllipseIE(x, y, eX, eY, color);
                }else{
                    _map.drawElllipse(x, y, eX, eY, color);
                }
            }

            /**
             * 画椭圆
             */
            _map.drawElllipseIE = function(x, y, eX, eY, color){
                _map.pointContext.beginPath();
                //设置弧线的颜色为蓝色
                _map.pointContext.fillStyle = color;
                //沿着坐标点(100,100)为圆心、半径为50px的圆的顺时针方向绘制弧线
                EvenCompEllipse(x, y, eX, eY); //椭圆
                _map.pointContext.fill();
                function EvenCompEllipse( x, y, a, b) {
                    _map.pointContext.save();
                    //选择a、b中的较大者作为arc方法的半径参数
                    var r = (a > b) ? a : b;
                    var ratioX = a / r; //横轴缩放比率
                    var ratioY = b / r; //纵轴缩放比率
                    _map.pointContext.scale(ratioX, ratioY); //进行缩放（均匀压缩）
                    _map.pointContext.beginPath();
                    //从椭圆的左端点开始逆时针绘制
                    _map.pointContext.moveTo((x + a) / ratioX, y / ratioY);
                    _map.pointContext.arc(x / ratioX, y / ratioY, r, 0, 2 * Math.PI);
                    _map.pointContext.closePath();
                    _map.pointContext.stroke();
                    _map.pointContext.restore();
                }
            }

            _map.drawElllipse=function(x, y, eX, eY, color){
                _map.pointContext.beginPath();
                //设置弧线的颜色为蓝色
                _map.pointContext.fillStyle = color;
                //沿着坐标点(100,100)为圆心、半径为50px的圆的顺时针方向绘制弧线
                _map.pointContext.ellipse(x,
                    y, eX,eY, 0, 0,2 * Math.PI);
                //按照指定的路径绘制弧线
                _map.pointContext.fill();
            }

            // 判断是否正在移动
            _map._moving = false;
            _map._moveStart = {x: 0, y: 0};
            _map._moveEnd = {x: 0, y: 0};
            _map._movePoint = null;
            _map._eventStartTime = 0;
            // 添加鼠标移动事件
            _map.canvas.addEventListener("mousemove", function(event){
                // 点移动
                if(_map._movePoint && _map._movePoint.isDrag){
                    _map._handleMouseMovePoint(event);
                }else{
                    _map._handleMouseMove(event);
                }
            });

            // 鼠标下按事件
            _map.canvas.addEventListener("mousedown", function(event){

                _map._eventStartTime = new Date().getTime();

                if (event.button == 2) {
                    _map._handleRightClick(event);
                }else{
                    if(_map._movePoint == null){
                        _map._movePoint = _map.checkBoundary(event.clientX, event.clientY);
                    }
                    // 点移动
                    if(_map._movePoint && _map._movePoint.isDrag){
                        _map._handlePointMouseDown(event);
                    }else{
                        _map._handleMouseDown(event);
                    }
                }

            });

            // 取消canvas右击事件
            _map.canvas.oncontextmenu=function (e) {
                e.preventDefault();
            };

            // 鼠标上浮事件
            _map.canvas.addEventListener("mouseup", function(event){
                if(_map._movePoint){
                    _map._handleMouseUpPoint(event);
                }
                _map._handleMouseUp(event);
            });

            // 添加鼠标点击事件
            _map.canvas.addEventListener("click", function(event){
                // 防止拖动出现点击事件
                if(new Date().getTime() - _map._eventStartTime <= 200){
                    _map._handleClick(event);
                }
            });

            // 处理移动
            _map._handleMouseMove = function(event){
                if(_map.isDrag && _map._moving){
                    _map._moveEnd = _map.windowToCanvas(event.clientX, event.clientY);
                    _map.canvas.style.cursor = 'move';
                    _map.imgX = _map._moveEnd.x - _map._moveStart.x;
                    _map.imgY = _map._moveEnd.y - _map._moveStart.y;
                    _map.drawImage()
                }
            }
            // 处理点移动
            _map._handleMouseMovePoint = function(event){
                var _pos = _map.convertEventPositionToImg(event, _map._movePoint.postionImg.width/2, _map._movePoint.postionImg.height);
                _map._movePoint.x = _pos.x;
                _map._movePoint.y = _pos.y;
                _map.canvas.style.cursor = 'move';
                _map.drawImage();
            }

            _map._handleMouseDown = function(event){
                // 开始移动
                _map._moving = true;
                // 开始位置
                _map._moveStart = _map.windowToCanvas(event.offsetX, event.offsetY);
                _map._moveStart.x = _map._moveStart.x - _map.imgX;
                _map._moveStart.y = _map._moveStart.y - _map.imgY;
            }

            _map._handlePointMouseDown = function(event){
                if(new Date().getTime() - _map._eventStartTime > 200){
                    // 开始移动
                    _map._movePoint._moving = true;
                    // 开始位置
                    var _pos = _map.convertEventPositionToImg(event, 0, 0);
                    _map._movePoint.x = _pos.x;
                    _map._movePoint.y = _pos.y;
                }

            }

            _map._handleMouseUp = function(event){
                _map._moving = false;
                _map._moveStart.x = _map.imgX;
                _map._moveStart.y = _map.imgY;
            }

            _map._handleMouseUpPoint = function(event){
                _map._movePoint._moving = false;
                _map._movePoint = null;
            }

            _map._handleClick = function(event){
                // 判断是否有点点击
                if(!_map.processPointEvent("click", event)){
                    if(_map.hasListener("click")){
                        _map.fire("click", event);
                    }
                }
            }

            _map._handleRightClick = function(event){
                // 判断是否右击
                if(!_map.processPointEvent("rightclick", event)){
                    if(_map.hasListener("rightclick")){
                        _map.fire("rightclick", event);
                    }
                }
            }

            // 判断是否点击了某个点
            _map.checkBoundary = function (x, y) {
                if (_map._pointList) {
                    var checkPos = _map.windowToCanvas(x,y);
                    x = checkPos.x;
                    y = checkPos.y;
                    for (var k in _map._pointList) {
                        var list = _map._pointList[k];
                        // 计算出点的方形坐标, 必须添加beginPath, 否则点发生变化时，会有多个框
                    // var startX = (list.x * _map.standardX + _map.imgX) * _map.imageScale - list.postionImg.width * _map.imageScale / 2;
                    // var startY = (list.y * _map.standardY + _map.imgY) * _map.imageScale - list.postionImg.height * _map.imageScale;
                    // var endX = startX + list.postionImg.width * _map.imageScale;
                    // var endY = startY +  list.postionImg.height * _map.imageScale;
                        _map.pointContext.beginPath();
                        _map.pointContext.rect(
                            (list.x * _map.standardX + _map.imgX) * _map.imageScale - list.postionImg.width * _map.imageScale / 2,
                            (list.y * _map.standardY + _map.imgY) * _map.imageScale - list.postionImg.height * _map.imageScale,
                            list.postionImg.width * _map.imageScale,
                            list.postionImg.height * _map.imageScale);
                        if (_map.pointContext.isPointInPath(x ,y)) {
//                    		_map.pointContext.stroke();
                            return _map._pointList[k];
                        }
//                     if(x >= startX && x <= endX && y >= startY && y <= endY){
//                         return _map._pointList[k];
//                     }
                    }
                }
                return null;
            };

            // 将坐标转换成具体图片上的坐标点
            _map._convertLocationToImg = function(x, y, offsetX, offsetY){
                var _x = (x / _map.imageScale + offsetX/2 - _map.imgX ) / _map.standardX;
                var _y = (y / _map.imageScale + offsetY/2 - _map.imgY) / _map.standardY;
                return {
                    x: _x,
                    y: _y
                }
            }

            // 将点击的坐标转换成图片坐标
            _map.convertEventPositionToImg = function(event, offsetX, offsetY){
                var startPoss = _map.windowToCanvas(event.clientX, event.clientY);

                return _map._convertLocationToImg(startPoss.x, startPoss.y, offsetX, offsetY);
            }

            // 将图片坐标转成canvas的点
            _map._convertLocationToCanvas = function(x, y, offsetX, offsetY){
                var _x = (x * _map.standardX + _map.imgX  - offsetX) * _map.imageScale;
                var _y = (y * _map.standardY + _map.imgY  - offsetY) * _map.imageScale ;
                return {
                    x: _x,
                    y: _y
                };
            }

            _map.windowToCanvas=function (x,y) {
                var box = _map.canvas.getBoundingClientRect();
                return {
                    x: (x - (box.left - (box.width - this.canvas.width/2 )))*2 ,
                    y: (y - (box.top - (box.height - this.canvas.height/2))) * 2
                };
            }; // 转换坐标

            _map.canvasToWindow=function (x,y) {
                var box = _map.canvas.getBoundingClientRect();
                var pos = _map._convertLocationToCanvas(x, y, 0, 0);
                return {
                    x: pos.x + box.left,
                    y: pos.y + box.top
                };
            }; // 转换坐标

            //点击的位置转为图片显示位置
            _map.winToPoint = function (x,y){
                var _x=((x-_map.imgX/2*_map.imageScale)/_map.standardX/_map.imageScale)*2;
                var _y=((y-_map.imgY/2*_map.imageScale)/_map.standardY/_map.imageScale)*2;
                return {
                    x:_x,
                    y:_y
                }

            }

            /**
             * 执行点的事件
             */
            _map.processPointEvent = function(eventType, event){
                var cPoint = _map.checkBoundary(event.clientX, event.clientY);

                if(cPoint){
                    if(cPoint.hasListener(eventType)){
                        cPoint.fire(eventType, event);
                        return true;
                    }
                }

                return false;
            }

            // 放大
            _map.toBig = function () {
                if(_map.imageScale < 2){
                    _map.imageScale = _map.imageScale * _map.scaleStep;
                }
                _map.drawImage()
            };

            // 缩小
            _map.toSmall = function () {
                if(_map.imageScale>0.7){
                    _map.imageScale = _map.imageScale / _map.scaleStep;
                }
                _map.drawImage()
            };

            // TODO 修改划线实现方法
            _map.drawLine=function (line) {
                for(var j=0;j<line.pointArr.length;j++){
                    if(line.pointArr[j+1]){
                        _map.lineContext.beginPath();
                        _map.lineContext.strokeStyle=line.color;
                        _map.lineContext.lineWidth=line.width;
                        _map.lineContext.moveTo((line.pointArr[j][0]* _map.standardX+_map.imgX)*_map.imageScale, (line.pointArr[j][1]* _map.standardY+_map.imgY)*_map.imageScale);
                        _map.lineContext.lineTo((line.pointArr[j+1][0]* _map.standardX+_map.imgX)*_map.imageScale, (line.pointArr[j+1][1]* _map.standardY+_map.imgY)*_map.imageScale);
                        _map.lineContext.stroke();
                    }
                }
            };

            /**
             * 清除线
             */
            _map.clearLine=function(){
                _map.lineContext.clearRect(0, 0, _map.canvas.width, _map.canvas.height);
                _map.drawImage();
            }

            /**
             * 还原
             */
            _map.toreduct=function () {
                _map.imageScale=1;
                _map.imgX=0;
                _map.imgY=0;
                _map.drawImage()
            };   //还原

            /**
             * 添加点
             */
            _map.addPoint = function(point){
                _map._pointList.push(point);
                point.postionImg.onload = function () {
                    _map.drawImage();
                }
            };

            /**
             * 一次添加多个点
             */
            _map.addPoints = function(points){
                if(points.length > 0){
                    _map._pointList = _map._pointList.concat(points);
                    points[0].postionImg.onload = function () {
                        _map.drawImage();
                    }
                    _map.drawImage();
                }

            }

            /**
             * 清空节点
             */
            _map.clearPoint = function(){
                _map._pointList = [];
                _map.drawImage();
            };

            _map.loadImg();
            return _map;

        }

        /**
         * 点对象
         */
        hsMap.Point = function(pointData){
            var point = this;
            point.x = pointData.x;
            point.y = pointData.y;
            point.isDrag = pointData.isDrag;
            point.img = pointData.img;
            point.extData = pointData.extData;
            point.bottom = pointData.bottom;
            if(point.bottom){
                if(!pointData.bottom.x){
                    point.bottom.x = 20;
                }
                if(!pointData.bottom.y){
                    point.bottom.y = 5;
                }
            }
            point.postionImg = new Image();
            point.loadPositionImg = function () {
                point.postionImg.src = point.img;
            };
            point.loadPositionImg();

            point._moving = false;

            return point;
        }

        /**
         * 线
         */
        hsMap.Line = function(lineData){
            // TODO 默认值
            var line =this;
            line.color = lineData.color;
            line.width = lineData.width;
            line.pointArr = lineData.pointArr;
            // if(!line.pointArr||line.pointArr===[]){
            //     line.pointArr=[{x:100,y:100},{x:200,y:200}]
            // }
            return line ;
        }

    }

    HSMap.prototype = {
        // 查看某个事件是否有监听
        hasListener: function (type) {
            if (this._listeners.hasOwnProperty(type)) {
                return true;
            } else {
                return false;
            }
        },

        // 为事件添加监听函数
        addListener: function (type, listener) {
            if (!this._listeners.hasOwnProperty(type)) {
                this._listeners[type] = [];
            }
            this._listeners[type].push(listener);
        },

        // 触发事件
        fire: function (type, event) {
            if (event == null || type == null) {
                return;
            }

            if (this._listeners[type] instanceof Array) {
                var listeners = this._listeners[type];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    listeners[i].call(this, event);
                }
            }
        },

        // 如果listener 为null，则清除当前事件下的全部事件监听
        removeListener: function (type, listener) {
            if (listener == null) {
                if (this._listeners.hasOwnProperty(type)) {
                    this._listeners[type] = [];
                }
            }

            if (this._listeners[type] instanceof Array) {
                var listeners = this._listeners[type];
                for (var i = 0, len = listeners.length; i < len; i++) {
                    if (listeners[i] === listener) {
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }

        }
    }

    window.HSMap = HSMap
})()
