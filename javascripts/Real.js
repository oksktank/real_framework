/**
 * Created with JetBrains WebStorm.
 * User: ihansol
 * Date: 12. 11. 25.
 * Time: 오후 3:24
 * To change this template use File | Settings | File Templates.
 */
(function(){
    var Real={
        socket:undefined,
        getSocket:function(){
            if(Real.socket==undefined){
                Real.socket=io.connect();
            }
            return Real.socket;
        },
        User:{
            getLoginUser:function(func){
                $.ajax({
                    type:'POST',
                    url:'/user/getLoginUser',
                    data:{},
                    success:function(data){
                        func(data);
                    }
                });
            }
        },
        Room:{
            roomName:'',
            onJoinUser:function(dat){},
            onLeaveUser:function(dat){},
            userList:{},
            init:function(data){
                $(function(){
                    if(data.roomName) Real.Room.roomName=data.roomName;
                    if(data.onJoinUser) Real.Room.onJoinUser=data.onJoinUser;
                    if(data.onLeaveUser) Real.Room.onLeaveUser=data.onLeaveUser;

                    Real.Room.getInitialUserList(Real.Room.roomName,function(dat){
                        Real.Room.userList=dat;
                    });
                    var socket=Real.getSocket();
                    socket.on('joinUser',function(dat){
                        Real.Room.userList[dat.socketId]=dat.user;
                        Real.Room.onJoinUser(dat);
                    });
                    socket.on('leaveUser',function(dat){
                        Real.Room.onLeaveUser(dat);
                        delete Real.Room.userList[dat];
                    });
                    if(Real.Room.roomName!=''){
                        Real.User.getLoginUser(function(data){
                           if(data!=undefined){
                               var id=data.id;
                               Real.Room.joinRoom({id:id,roomName:Real.Room.roomName},socket);
                           }
                        });

                    }

                });
            },
            getUserList:function(){
                return Real.Room.userList;
            }
            ,
            joinRoom:function(data,socket){
                socket.emit('joinRoom',data);

            },
            getInitialUserList:function(roomName,func){
                $.ajax({
                    type:'POST',
                    url:'/room/getInitialUserList',
                    data:{
                        roomName:roomName
                    },
                    success:function(data){
                        console.log(data);
                        func(data);
                    }
                });
            }
        },
        RoomList:{
            renderTo:'' ,// default,
            defaultTitleTrId:'roomTitleTr',
            defaultTitleTd:'Room Name',
            init: function(data){
                $(function(){
                    if(data.renderTo) Real.RoomList.renderTo=data.renderTo;
                    if(data.defaultTitleTrId) Real.RoomList.defaultTitleTrId=data.defaultTitleTrId;
                    if(data.defaultTitleTd) Real.RoomList.defaultTitleTd=data.defaultTitleTd;
                    if(data.appendRoomList) Real.RoomList.appendRoomList=data.appendRoomList;
                    console.log('renderTo:'+Real.RoomList.renderTo);
                    var socket=Real.getSocket();
                    socket.on('roomAdded',function(data){
                        var roomName=data.roomName;
                        Real.RoomList.appendRoomList(roomName);
                    });
                    var render=$(Real.RoomList.renderTo);
                    render.append(Real.RoomList.getTable);

                    var roomList=data.roomList;
                    jQuery.each(roomList, function(i, val) {
                        Real.RoomList.appendRoomList(i)
                    });
                });

            },
            appendRoomList:function(roomName){
                $('<tr><td><a href="/room/'+roomName+'">'+roomName+'</a></td></tr>').insertAfter('#roomTitleTr');
            },
            getTable:function(){
                return '<table><tr id="'+Real.RoomList.defaultTitleTrId+'"><td>'+Real.RoomList.defaultTitleTd+'</td></tr></table>';
            },
            makeRoom:function(data){
                var roomName=$(data).val();
                Real.getSocket().emit('makeRoom',roomName);
            }
        },
        Score:{
            roomName:'',
            renderTo:'',//default
            nameTitle:'NAME',
            scoreTitle:'SCORE',
            width:'98%',
            height:'98%',
            textAlign:'center',
            init:function(data){
                $(function(){
                    //초기 셋팅
                    if(data.roomName) Real.Score.roomName=data.roomName;
                    if(data.renderTo) Real.Score.renderTo=data.renderTo;
                    if(data.nameTitle) Real.Score.nameTitle=data.nameTitle;
                    if(data.scoreTitle) Real.Score.scoreTitle=data.scoreTitle;
                    if(data.width) Real.Score.width=data.width;
                    if(data.height) Real.Score.height=data.height;
                    if(data.textAlign) Real.Score.textAlign=data.textAlign;
                    //테이블 생성
                    Real.Score.appendScoreTable();
                    //스타일 적용
                    Real.Score.setStyle();
                    //서버로부터 messageServer이벤트 받으면 같은 이름 찾아서 그 스코어 변경
                    var socket = Real.getSocket();//소켓 연결
                    socket.on('scoreServer',function(data){
                        console.log('client receive data:', data);
                        $('#'+data.name+' #pscore').html(data.score);

                    });
                });
            },
            setStyle:function(){

                $('#scoreTable').css('margin','0 auto');//테이블 중앙 정렬
                $('#scoreTable').css('width',Real.Score.width);//넓이
                $('#scoreTable').css('height',Real.Score.height);//높이
                $('#scoreTable').css('text-align',Real.Score.textAlign);//택스트 중앙 정렬
                $('#scoreTable').attr('border','1px solid black');

                $('#scoreTable').css('border-collapse','separate');
                $('#scoreTable').css('border-bottom','3px solid #8cb0c8');
                $('#scoreTable tbody td, #scoreTable tbody th').css('background','#ADBBCA');


            },
            appendScoreTable:function(){
                var render=$(Real.Score.renderTo);
                $('<table id="scoreTable"></table>').appendTo(render);
                $('<tr><th>'+Real.Score.nameTitle+'</td><td>'+Real.Score.scoreTitle+'</th></tr>').appendTo('#scoreTable');
                /*for(var i =0;i<4;i++){
                    $('<tr id=player'+(i+1)+'><td >player'+(i+1)+'</td><td id=pscore>'+0+'</td></tr>').appendTo('#scoreTable');
                } */
                Real.Room.getInitialUserList(Real.Score.roomName,function(data){
                    jQuery.each(data, function(i, val) {
                       $('<tr id='+i+'><td >'+val.id+'</td><td id=pscore>'+0+'</td></tr>').appendTo('#scoreTable');
                       Real.Score.sendScore(0,i);
                    });

                });
            },
            sendScore:function(score,id){
                var socket=Real.getSocket();
                var name=$("#loginUserId").val();
                var sessionid=id;
                if(sessionid==undefined){
                    sessionid=socket.socket.sessionid;
                }
                if(name!=undefined&&name!='undefined'){
                    socket.emit('scoreClient',{name: sessionid,score: score,room: Real.Score.roomName});
                }
            },
            onUserJoin:function(data){
                $('<tr id='+data.socketId+'><td >'+data.user.id+'</td><td id=pscore>'+0+'</td></tr>').appendTo('#scoreTable');
            },
            onUserLeave:function(data){
                $('#scoreTable #'+data.socketId).remove();
            }
        } ,
        Event:{
            roomName:'',
            renderTo:'',//default
            width:'90%',
            height:'90%',
            textAlign:'center',
            init:function(data){
                $(function(){
                    //초기 셋팅
                    if(data.roomName) Real.Event.roomName=data.roomName;
                    if(data.renderTo) Real.Event.renderTo=data.renderTo;
                    if(data.width) Real.Event.width=data.width;
                    if(data.height) Real.Event.height=data.height;
                    if(data.textAlign) Real.Event.textAlign=data.textAlign;
                    //박스 베치
                    Real.Event.appendEventBox();
                    //스타일 적용
                    Real.Event.setStyle();
                    //서버로부터 data를 받아서 출력
                    var socket = Real.getSocket();//소켓 연결
                    socket.on('eventServer',function(data){
                        console.log('client receive data:', data);

                        $('<div id="eventSingle" style="border: 1px solid black; height: 30px">'+data.name+': '+data.event+'</div>').appendTo('#eventBox');
                        $('#eventBox').scrollTop($('#eventBox')[0].scrollHeight);
                    });
                });
            },
            setStyle:function(){
                $('#eventBox').css('margin','0 auto');
                $('#eventBox').css('overflow-y','scroll');
                $('#eventBox').css('border','10px solid blue');
                $('#eventBox').css('width',Real.Event.width);
                $('#eventBox').css('height',Real.Event.height);
                $('#eventBox').css('text-align',Real.Event.textAlign);
            },
            appendEventBox:function(data){
                var render=$(Real.Event.renderTo);
                $('<div id="eventBox"></div>').appendTo(render);
            },
            sendEvent:function(name,event,room){

                var socket=Real.getSocket();
                socket.emit('eventClient',{name: name,event: event,room: Real.Event.roomName});
            }
        },
        Chat:{
            renderTo:'',
            chatType:'public',
            roomName:'cocktail',
            width:'700',
            height:'400',
            init:function(data){
                $(function(){
                    if(data.renderTo) Real.Chat.renderTo=data.renderTo;
                    if(data.chatType) Real.Chat.chatType = data.chatType;
                    if(data.roomName) Real.Chat.roomName = data.roomName;
                    if(data.width) Real.Chat.width = data.width;
                    if(data.height) Real.Chat.height = data.height;
                    var socket = Real.getSocket();
                    var render = $(Real.Chat.renderTo);

                    //최소 가로 400px
                    if(Number(Real.Chat.width)<400) Real.Chat.width = 400;
                    //최소 세로 200px
                    if(Number(Real.Chat.height)<200) Real.Chat.height = 200;

                    var width1 = Real.Chat.width + 'px';
                    var width2 = Number(Real.Chat.width) - Number(10) + 'px';
                    //var width3 = 'span' + parseInt((Number(Real.Chat.width)-Number(151))/100);
                    var width3 = Number(Real.Chat.width) - Number(230) + 'px';
                    var height = Number(Real.Chat.height) - Number(50) + 'px';

                    //미적용부분-------------
                    //chatType=public -> 공개 채팅방; room과 연동되지 않으므로 닉리스트 따로 관리
                    //chatType=room -> 방에 존재하는 채팅방; room과 연동되므로 room 유저리스트를 가져옴
                    var u_name = $('#loginUserId').val()  //받아오도록 수정해야함

                    //-----------------------

                    //div 동적 생성
                    render.append('<div id="user_id"></div><div id="chatbox"></div>');
                    // render.append('<div id="chatbox"></div>');
                    $('#chatbox').css('text-align','center');
                    $('#chatbox').css('width',width1);

                    $('<div id="chat_content"></div>').appendTo('#chatbox');
                    $('#chat_content').css('width',width2);
                    $('#chat_content').css('height',height);
                    $('#chat_content').css('overflow-y','scroll');
                    $('#chat_content').css('overflow-x','hidden');
                    $('#chat_content').css('text-align','left');
                    $('#chat_content').css('padding','5px');

                    $('<table id="content"></table>').appendTo('#chat_content');
                    $('#content').attr('class','table table-condensed');

                    $('<div id="chat_input"></div>').appendTo('#chatbox');

                    $('<div id="input"></div>').appendTo('#chat_input');
                    $('#input').attr('class','input-prepend input-append');
                    $('#input').css('margin','5px');

                    $('<form id="msg_form" onsubmit="return false;"></form>').appendTo('#input');

                    $('<select id="select_obj"></select>').appendTo('#msg_form');
                    $('#select_obj').attr('class','span2');

                    $('<span class="add-on">>></span>').appendTo('#msg_form');

                    $('<input id="appendedPrependedInputButton" type="text">').appendTo('#msg_form');
                    //$('#appendedPrependedInputButton').attr('class',width3);
                    $('#appendedPrependedInputButton').css('width',width3);
                    $('#appendedPrependedInputButton').attr('placeholder','Type message...');

                    $('<button id="chat_btn" type="submit"><b>OK</b></button>').appendTo('#msg_form');
                    $('#chat_btn').attr('class','btn btn-success');




                    socket.on('message', function (data){
                        var output = '';
                        if(u_name == data.name) //내가 쓴 메세지이면
                        {
                            output+='<tr class="success">';
                        }
                        else
                        {
                            output +='<tr>';
                        }
                        output +='<td><b>' + data.name + ' > </b>';
                        output +=' ' + data.message + '</td></tr>';
                        $(output).appendTo('#content');

                        chat_content.scrollTop=chat_content.scrollHeight;
                    });

                    //귓속말 구분도 다시할것 내가 나한테 보내면 To 두번 뜸 ㅋ
                    socket.on('whisper', function (data){
                        var output = '';
                        if(data.dir) //내가 보낸 메세지이면
                        {
                            output +='<tr class="success">';
                            output +='<td><b>To ' + data.type + ' "</b>';
                        }
                        else
                        {
                            output +='<tr class="warning">';
                            output +='<td><b>From ' + data.name + ' >> </b>';
                        }
                        output +=' ' + data.message + '</td></tr>';
                        $(output).appendTo('#content');

                        chat_content.scrollTop=chat_content.scrollHeight;
                    });


                    //입장이벤트
                    socket.emit('sysIn',{
                        name: u_name
                        //date: new Date().toUTCString()
                    });

                    //이름설정
                    $('#user_id').html("<h4>"+ u_name +"</h4> in <b>" + Real.Chat.roomName + "</b>");

                    //유저리스트 초기화
                    Real.Room.getInitialUserList(Real.Chat.roomName,function(dat){
                        var userList=dat;
                        $("#select_obj").append('<option value="public">모두에게</option>');
                        console.log(userList);
                        jQuery.each(userList, function(i, val) {
                            $("#select_obj").append('<option id="'+i+'" value="'+i+'">'+val.id+'</option>');
                        });
                    });

                    $('#chat_btn').click(function(){
                        var str = $('#appendedPrependedInputButton').val();
                        appendedPrependedInputButton.value='';

                        //빈 문자열이 아니면
                        if(str){
                            var socket=Real.getSocket();
                            console.log(socket.socket.sessionid);
                            socket.emit('message', {

                                type: $('#select_obj').val(),
                                socketId: socket.socket.sessionid,
                                name:socket.socket.sessionid,
                                message: str,
                                date: new Date().toUTCString(),
                                room:Real.Chat.roomName
                            });
                        }
                    });

                });
            },
            onUserJoin:function(data){
                var output ='';
                output +='<tr class="info">';
                output +='<td><b>' + data.user.id + '</b>님이 입장하셨습니다.</td></tr>';
                $(output).appendTo('#content');
                if(data.user!=undefined){
                    $("#select_obj").append('<option id="'+data.socketId+'" value="'+data.socketId+'">'+data.user.id+'</option>');
                }
                chat_content.scrollTop=chat_content.scrollHeight;
            },
            onUserLeave:function(data){
                var output ='';
                output +='<tr class="error">';
                output +='<td><b>' + data.user.id + '</b>님이 퇴장하셨습니다.</td></tr>';
                $(output).appendTo('#content');
                $("#select_obj #"+data.socketId).remove();
                chat_content.scrollTop=chat_content.scrollHeight;
            }
        }
    };
    if(!window.Real){window.Real=Real;}
})();