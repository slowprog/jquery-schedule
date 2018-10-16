
(function($) {
    $.fn.timeSchedule = function(options){
        let defaults = {
            rows : {},
            startTime: "07:00",
            endTime: "19:30",
            widthTimeX:25,       // 1cell辺りの幅(px)
            widthTime:600,       // 区切り時間(秒)
            timeLineY:50,        // timeline height(px)
            timeLineBorder:1,    // timeline height border
            timeBorder:1,        // border width
            timeLinePaddingTop:0,
            timeLinePaddingBottom:0,
            headTimeBorder:1,        // time border width
            dataWidth:160,           // data width
            entireHeight:"470px",    // entire max height
            verticalScrollbar:0,     // vertical scrollbar width
            draggable:true,          // Schedule is draggable (Require jQuery UI if true)
            resizable:true,          // Schedule is resizable (Require jQuery UI if true)
            // event
            init_data: null,    // Trigger when initialize titile column.
            change: null,
            click: null,        // Trigger when click schedules.
            append: null,       // Trigger when append schedules.
            time_click: null,   // Trigger when click time.
            debug:"",            // debug selecter
            // rendering
            css_border_box: false // Specify `true` if CSS box-sizing property is `content-box`. Need `true` if construct with bootstrap.
        };

        this.calcStringTime = function(string) {
            let slice = string.split(':');
            let h = Number(slice[0]) * 60 * 60;
            let i = Number(slice[1]) * 60;
            let min = h + i;
            return min;
        };
        this.formatTime = function(min) {
            let h = "" + (min/36000|0) + (min/3600%10|0);
            let i = "" + (min%3600/600|0) + (min%3600/60%10|0);
            let string = h + ":" + i;
            return string;
        };

        let setting = $.extend(defaults,options);
        this.setting = setting;
        let scheduleData = new Array();
        let timelineData = new Array();
        let $element = $(this);
        let element = (this);
        let tableStartTime = element.calcStringTime(setting.startTime);
        let tableEndTime = element.calcStringTime(setting.endTime);
        let currentNode = null;
        tableStartTime -= (tableStartTime % setting.widthTime);
        tableEndTime -= (tableEndTime % setting.widthTime);

        this.getTimelineData = function(){
            return timelineData;
        }
        // 現在のタイムライン番号を取得
        this.getTimeLineNumber = function(top){
            let num = 0;
            let n = 0;
            let tn = Math.ceil(top / (setting.timeLineY + setting.timeLinePaddingTop + setting.timeLinePaddingBottom));
            for(let i in setting.rows){
                let r = setting.rows[i];
                let tr = 0;
                if(typeof r["schedule"] == Object){
                    tr = r["schedule"].length;
                }
                if(currentNode && currentNode["timeline"]){
                    tr ++;
                }
                n += Math.max(tr,1);
                if(n >= tn){
                    break;
                }
                num ++;
            }
            return num;
        }
        // Добавляет событие по времени в календарь.
        this.addScheduleData = function (data) {
            data = this.getNormalizeData(data);

            let st = Math.ceil((data["start"] - tableStartTime) / setting.widthTime);
            let et = Math.ceil((data["end"] - tableStartTime) / setting.widthTime);
            let $bar = jQuery('<div class="sc_Bar"><span class="head"><span class="time"></span></span><span class="text"></span></div>');
            let stext = element.formatTime(data["start"]);
            let etext = element.formatTime(data["end"]);

            $bar.css({
                left : (st * setting.widthTimeX),
                top : 0,
                width : ((et - st) * setting.widthTimeX),
                height : (setting.timeLineY) - 2
            });
            $bar.find(".time").text(stext + " – " + etext);
            if(data["text"]){
                $bar.find(".text").html(data["text"]);
            }
            if(data["class"]){
                $bar.addClass(data["class"]);
            }
            if(data["disabled"]){
                $bar.addClass('disabled_bar');
            }
            // データの追加
            scheduleData.push(data);
            // key
            let key = scheduleData.length - 1;
            $bar.data('sc_key', key);
            $bar.attr('data-sc_key', key);

            $element.find('.sc_main .timeline[data-timeline=' + data["timeline"] + ']').append($bar);

            $bar.bind("mouseup",function(){
                // コールバックがセットされていたら呼出
                if(setting.click){
                    if(jQuery(this).data("dragCheck") !== true && jQuery(this).data("resizeCheck") !== true){
                        if ($(this).closest('.dragscroll').hasClass('dragging')) {
                            // event.preventDefault();
                        } else {
                            let node = jQuery(this);
                            let sc_key = node.data("sc_key");
                            setting.click(node, scheduleData[sc_key]);
                        }
                    }
                }
            });

            let $node = $element.find(".sc_Bar");
            // move node.
            if (setting.draggable) {
                $node.draggable({
                    grid: [ setting.widthTimeX, 1 ],
                    containment: ".sc_main",
                    helper : 'original',
                    start: function(event, ui) {
                        let node = {};
                        node["node"] = this;
                        node["offsetTop"] = ui.position.top;
                        node["offsetLeft"] = ui.position.left;
                        node["currentTop"] = ui.position.top;
                        node["currentLeft"] = ui.position.left;
                        node["timeline"] = element.getTimeLineNumber(ui.position.top);
                        node["nowTimeline"] = node["timeline"];
                        currentNode = node;
                    },
                    drag: function(event, ui) {
                        jQuery(this).data("dragCheck",true);
                        if(!currentNode){
                            return false;
                        }
                        let $moveNode = jQuery(this);
                        let sc_key = $moveNode.data("sc_key");
                        let originalTop = ui.originalPosition.top;
                        let originalLeft = ui.originalPosition.left;
                        let positionTop = ui.position.top;
                        let positionLeft = ui.position.left;
                        let timelineNum = element.getTimeLineNumber(ui.position.top);
                        // 位置の修正
                        //ui.position.top = Math.floor(ui.position.top / setting.timeLineY) * setting.timeLineY;
                        //ui.position.top = element.getScheduleCount(timelineNum) * setting.timeLineY;
                        ui.position.left = Math.floor(ui.position.left / setting.widthTimeX) * setting.widthTimeX;


                        //$moveNode.find(".text").text(timelineNum+" "+(element.getScheduleCount(timelineNum) + 1));
                        if(currentNode["nowTimeline"] != timelineNum){
                            // 高さの調節
                            //element.resizeRow(currentNode["nowTimeline"],element.getScheduleCount(currentNode["nowTimeline"]));
                            //element.resizeRow(timelineNum,element.getScheduleCount(timelineNum) + 1);
                            // 現在のタイムライン
                            currentNode["nowTimeline"] = timelineNum;
                        }else{
                            //ui.position.top = currentNode["currentTop"];
                        }
                        currentNode["currentTop"] = ui.position.top;
                        currentNode["currentLeft"] = ui.position.left;
                        // テキスト変更
                        element.rewriteBarText($moveNode,scheduleData[sc_key]);
                        return true;
                    },
                    // 要素の移動が終った後の処理
                    stop: function(event, ui) {
                        jQuery(this).data("dragCheck",false);
                        currentNode = null;

                        let node = jQuery(this);
                        let sc_key = node.data("sc_key");
                        let x = node.position().left;
                        let w = node.width();
                        let start = tableStartTime + (Math.floor(x / setting.widthTimeX) * setting.widthTime);
                        //let end = tableStartTime + (Math.floor((x + w) / setting.widthTimeX) * setting.widthTime);
                        let end = start + ((scheduleData[sc_key]["end"] - scheduleData[sc_key]["start"]));

                        scheduleData[sc_key]["start"] = start;
                        scheduleData[sc_key]["end"] = end;
                        // コールバックがセットされていたら呼出
                        if(setting.change){
                            setting.change(node, scheduleData[sc_key]);
                        }
                    }
                });
            }
            if (setting.resizable) {
                $node.resizable({
                    handles:'e',
                    grid: [ setting.widthTimeX, setting.timeLineY ],
                    minWidth:setting.widthTimeX,
                    start: function(event, ui){
                        let node = jQuery(this);
                        node.data("resizeCheck",true);
                    },
                    // 要素の移動が終った後の処理
                    stop: function(event, ui){
                        let node = jQuery(this);
                        let sc_key = node.data("sc_key");
                        let x = node.position().left;
                        let w = node.width();
                        let start = tableStartTime + (Math.floor(x / setting.widthTimeX) * setting.widthTime);
                        let end = tableStartTime + (Math.floor((x + w) / setting.widthTimeX) * setting.widthTime);
                        let timelineNum = scheduleData[sc_key]["timeline"];

                        scheduleData[sc_key]["start"] = start;
                        scheduleData[sc_key]["end"] = end;

                        // 高さ調整
                        element.resetBarPosition(timelineNum);
                        // テキスト変更
                        element.rewriteBarText(node,scheduleData[sc_key]);

                        node.data("resizeCheck",false);
                        // コールバックがセットされていたら呼出
                        if(setting.change){
                            setting.change(node, scheduleData[sc_key]);
                        }
                    }
                });
            }
            return key;
        };
        // Получить кол-во событий в линии
        this.getScheduleCount = function (n) {
            let num = 0;
            for (let i in scheduleData) {
                if (scheduleData[i]["timeline"] == n) {
                    num ++;
                }
            }
            return num;
        };
        // Нормализует данные в связи с ограничением времени и наложениями.
        this.getNormalizeData = function (data) {
            // Если происходит наложение, то отодвинуть в одну из сторон.
            let overlappingTime = this.getOverlappingTime(data["timeline"], data["start"], data["end"]);
            if (overlappingTime) {
                data["start"] += overlappingTime;
                data["end"] += overlappingTime;
            }
            // Если после смещения оно выползает за пределы, то сравнять с ними.
            if (data["start"] < tableStartTime) {
                data["start"] = tableStartTime;
            }

            if (data["end"] > tableEndTime) {
                data["end"] = tableEndTime;
            }

            return data;
        };
        // Возвращает кол-во времени в секудах, которое накладывается на ближайшее событие, если есть
        this.getOverlappingTime = function (timeline, start, end) {
            for (let i in scheduleData) {
                if (scheduleData[i]["timeline"] == timeline ){
                    // Если пересечение спереди
                    if (scheduleData[i]["start"] < end && scheduleData[i]["start"] > start) {
                        return -(end - scheduleData[i]["start"]);
                    }
                    // Если пересечение сзади
                    if (scheduleData[i]["end"] > start && scheduleData[i]["end"] < end) {
                        return scheduleData[i]["end"] - start;
                    }
                }
            }

            return null;
        };
        // add
        this.addRow = function(timeline, row){
            let title = row["title"];
            let id    = timeline;
            let html  = '<div class="timeline" data-timeline="' + id + '"><span>'+title+'</span></div>';
            let $data = jQuery(html);
            // event call
            if(setting.init_data){
                setting.init_data($data,row);
            }
            $element.find('.sc_data_scroll').append($data);

            html = '';
            html += '<div class="timeline"></div>';
            let $timeline = jQuery(html);

            $timeline
                .data('timeline', id)
                .attr('data-timeline', id)
            ;

            for(let t=tableStartTime;t<tableEndTime;t+=setting.widthTime){
                let $tl = jQuery('<div class="tl"></div>');
                let w = setting.css_border_box
                    ? setting.widthTimeX
                    : setting.widthTimeX - setting.timeBorder ;
                $tl.width(w);

                $tl.data("time",element.formatTime(t));
                $tl.data("timeline",timeline);
                $timeline.append($tl);
            }
            // クリックイベント
            if(setting.time_click){
                $timeline.find(".tl").click(function () {
                    // currentEvent

                    setting.time_click(
                        this,
                        jQuery(this).data("time"),
                        jQuery(this).data("timeline"),
                        timelineData[jQuery(this).data("timeline")]
                    );
                });
            }
            $element.find('.sc_main').append($timeline);

            timelineData[timeline] = row;

            if(row["class"] && (row["class"] != "")){
                $element.find('.sc_data .timeline[data-timeline=' + id + ']').addClass(row["class"]);
                $element.find('.sc_main .timeline[data-timeline=' + id + ']').addClass(row["class"]);
            }
            // スケジュールタイムライン
            if(row["schedule"]){
                for(let i in row["schedule"]){
                    let bdata = row["schedule"][i];
                    let s = element.calcStringTime(bdata["start"]);
                    let e = element.calcStringTime(bdata["end"]);

                    let data = {};
                    data["timeline"] = id;
                    data["start"] = s;
                    data["end"] = e;
                    if(bdata["text"]){
                        data["text"] = bdata["text"];
                    }
                    data["data"] = {};
                    if(bdata["data"]){
                        data["data"] = bdata["data"];
                    }
                    if(bdata["class"]){
                        data["class"] = bdata["class"];
                    }
                    if(bdata["disabled"]){
                        data["disabled"] = bdata["disabled"];
                    }
                    element.addScheduleData(data);
                }
            }
            // 高さの調整
            element.resetBarPosition(id);
            if (setting.draggable) {
                $element.find('.sc_main .timeline[data-timeline=' + id + ']').droppable({
                    accept: ".sc_Bar",
                    drop: function(ev, ui) {
                        let node = ui.draggable;
                        let sc_key = node.data("sc_key");
                        let nowTimelineNum = scheduleData[sc_key]["timeline"];
                        let timelineNum = $element.find('.sc_main .timeline').index(this);
                        // タイムラインの変更
                        scheduleData[sc_key]["timeline"] = timelineNum;
                        node.appendTo(this);
                        // 高さ調整
                        element.resetBarPosition(nowTimelineNum);
                        element.resetBarPosition(timelineNum);
                    }
                });
            }
            // コールバックがセットされていたら呼出
            if(setting.append){
                $element.find('.sc_main .timeline[data-timeline=' + id + ']').find(".sc_Bar").each(function(){
                    let node = jQuery(this);
                    let sc_key = node.data("sc_key");
                    setting.append(node, scheduleData[sc_key]);
                });
            }
        };
        this.getScheduleData = function(){
            let data = new Array();

            for(let i in timelineData){
                if(typeof timelineData[i] == "undefined") continue;
                let timeline = jQuery.extend(true, {}, timelineData[i]);
                timeline.schedule = new Array();
                data.push(timeline);
            }

            for(let i in scheduleData){
                if(typeof scheduleData[i] == "undefined") continue;
                let schedule = jQuery.extend(true, {}, scheduleData[i]);
                schedule.start = this.formatTime(schedule.start);
                schedule.end = this.formatTime(schedule.end);
                let timelineIndex = schedule.timeline;
                delete schedule.timeline;
                data[timelineIndex].schedule.push(schedule);
            }

            return data;
        };
        // Удаляет определённое событие по ключю
        this.removeBar = function (sc_key) {
            scheduleData.splice(sc_key, 1);

            $element.find('.sc_Bar[data-sc_key="' + sc_key + '"]').remove();
        }
        // テキストの変更
        this.rewriteBarText = function(node,data){
            let x = node.position().left;
            let w = node.width();
            let start = tableStartTime + (Math.floor(x / setting.widthTimeX) * setting.widthTime);
            //let end = tableStartTime + (Math.floor((x + w) / setting.widthTimeX) * setting.widthTime);
            let end = start + (data["end"] - data["start"]);
            let html = element.formatTime(start)+"-"+element.formatTime(end);
            jQuery(node).find(".time").html(html);
        }
        this.resetBarPosition = function(n){
            // 要素の並び替え
            let $bar_list = $element.find('.sc_main .timeline[data-timeline=' + n + ']').find(".sc_Bar");
            let codes = [];
            for(let i=0;i<$bar_list.length;i++){
                codes[i] = {code:i,x:jQuery($bar_list[i]).position().left};
            };
            // ソート
            codes.sort(function(a,b){
                if(a["x"] < b["x"]){
                    return -1;
                }else if(a["x"] > b["x"]){
                    return 1;
                }
                return 0;
            });
            let check = [];
            let h = 0;
            let $e1,$e2;
            let c1,c2;
            let s1,e1,s2,e2;
            for(let i=0;i<codes.length;i++){
                c1 = codes[i]["code"];
                $e1 = jQuery($bar_list[c1]);
                for(h=0;h<check.length;h++){
                    let next = false;
                    L: for(let j=0;j<check[h].length;j++){
                        c2 = check[h][j];
                        $e2 = jQuery($bar_list[c2]);

                        s1 = $e1.position().left;
                        e1 = $e1.position().left + $e1.width();
                        s2 = $e2.position().left;
                        e2 = $e2.position().left + $e2.width();
                        if(s1 < e2 && e1 > s2){
                            next = true;
                            continue L;
                        }
                    }
                    if(!next){
                        break;
                    }
                }
                if(!check[h]){
                    check[h] = [];
                }
                $e1.css({top:((h * setting.timeLineY) + setting.timeLinePaddingTop)});
                check[h][check[h].length] = c1;
            }
            // 高さの調整
            this.resizeRow(n,check.length);
        };
        this.resizeRow = function(n,height){
            //let h = Math.max(element.getScheduleCount(n),1);
            let h = Math.max(height,1);
            $element.find('.sc_data .timeline[data-timeline=' + n + ']').height((h * setting.timeLineY) - setting.timeLineBorder + setting.timeLinePaddingTop + setting.timeLinePaddingBottom);
            $element.find('.sc_main .timeline[data-timeline=' + n + ']').height((h * setting.timeLineY) - setting.timeLineBorder + setting.timeLinePaddingTop + setting.timeLinePaddingBottom);

            $element.find('.sc_main .timeline[data-timeline=' + n + ']').find(".sc_bgBar").each(function(){
                jQuery(this).height(jQuery(this).closest(".timeline").height());
            });

            $element.find(".sc_data").height($element.find(".sc_main_box").height());
        }
        // resizeWindow
        this.resizeWindow = function(){
            let sc_width = $element.width();
            let sc_main_width = sc_width - setting.dataWidth - (setting.verticalScrollbar);
            let cell_num = Math.floor((tableEndTime - tableStartTime) / setting.widthTime);
            $element.find(".sc_header_cell").width(setting.dataWidth);
            $element.find(".sc_data,.sc_data_scroll").width(setting.dataWidth);
            $element.find(".sc_header").width(sc_main_width);
            $element.find(".sc_main_box").width(sc_main_width);
            $element.find(".sc_header_scroll").width(setting.widthTimeX*cell_num);
            $element.find(".sc_main_scroll").width(setting.widthTimeX*cell_num);

        };
        // init
        this.init = function(){
            let html = '';
            html += '<div class="sc_menu">'+"\n";
            html += '<div class="sc_header_cell"><span>&nbsp;</span></div>'+"\n";
            html += '<div class="sc_header">'+"\n";
            html += '<div class="sc_header_scroll">'+"\n";
            html += '</div>'+"\n";
            html += '</div>'+"\n";
            html += '<br class="clear" />'+"\n";
            html += '</div>'+"\n";
            html += '<div class="sc_wrapper">'+"\n";
            html += '<div class="sc_data">'+"\n";
            html += '<div class="sc_data_scroll">'+"\n";
            html += '</div>'+"\n";
            html += '</div>'+"\n";
            html += '<div class="sc_main_box horizontal dragscroll">'+"\n";
            html += '<div class="sc_main_scroll">'+"\n";
            html += '<div class="sc_main">'+"\n";
            html += '</div>'+"\n";
            html += '</div>'+"\n";
            html += '</div>'+"\n";
            html += '<br class="clear" />'+"\n";
            html += '</div>'+"\n";

            $element.append(html);

            $element.find(".sc_main_box").scroll(function(){
                $element.find(".sc_data_scroll").css("top", $(this).scrollTop() * -1);
                $element.find(".sc_header_scroll").css("left", $(this).scrollLeft() * -1);
            });
            $element.find(".sc_data").css("max-height", setting.entireHeight);
            $element.find(".sc_main_box").css("max-height", setting.entireHeight);

            // add time cell
            let cell_num = Math.floor((tableEndTime - tableStartTime) / setting.widthTime);
            let before_time = -1;
            for(let t=tableStartTime;t<tableEndTime;t+=setting.widthTime){

                if(
                    (before_time < 0) ||
                    (Math.floor(before_time / 3600) != Math.floor(t / 3600))){
                    let html = '';
                    html += '<div class="sc_time">'+element.formatTime(t)+'</div>';
                    let $time = jQuery(html);
                    let cell_num = Math.floor(Number(Math.min((Math.ceil((t + setting.widthTime) / 3600) * 3600),tableEndTime) - t) / setting.widthTime);
                    let w = setting.css_border_box
                        ? (cell_num * setting.widthTimeX)
                        : (cell_num * setting.widthTimeX) - setting.headTimeBorder ;
                    $time.width(w);
                    $element.find(".sc_header_scroll").append($time);

                    before_time = t;
                }
            }

            jQuery(window).resize(function(){
                element.resizeWindow();
            }).trigger("resize");

            // addrow
            for(let i in setting.rows){
                this.addRow(i,setting.rows[i]);
            }
        };
        // 初期化
        this.init();

        this.debug = function(){
            let html = '';
            for(let i in scheduleData){
                html += '<div>';

                html += i+" : ";
                let d = scheduleData[i];
                for(let n in d){
                    let dd = d[n];
                    html += n+" "+dd;
                }

                html += '</div>';
            }
            jQuery(setting.debug).html(html);
        };
        if(setting.debug && setting.debug != ""){
            setInterval(function(){
                element.debug();
            },10);
        }

        return( this );
    };
})(jQuery);
