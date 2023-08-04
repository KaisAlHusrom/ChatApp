import { useEffect, useState } from "react"
import { over } from "stompjs"
import SockJS from "sockjs-client/dist/sockjs";


var stompClient = null
const ChatRoom = () => {
    const [publicChats, setPublicChats] = useState([])
    const [privateChats, setPrivateChats] = useState(new Map())
    const [tab, setTab] = useState("ChatRoom")
    const [userData, setUserData] = useState({
        username: "",
        recievername: "",
        connected: false,
        message: "",
    })

    const handleValue = (e) => {
        const value = e.target.value;
        setUserData({...userData, [e.target.name] : value})
    }

    const registerUser = () => {
        const Sock = new SockJS("http://localhost:8080/ws")
        stompClient = over(Sock)
        stompClient.connect({}, onConnected, onError)
    }

    const onConnected = () => {
        setUserData({...userData, "connected":true})
        stompClient.subscribe("/chatroom/public", onPublicMessageReceived)
        stompClient.subscribe(`/user/${userData.username}/private`, onPrivateMessageReceived)
        userJoin()
    }

    const userJoin = () => {
        let chatMessage = {
            senderName: userData.username,
            status: "JOIN"
        }
        stompClient.send("/app/message", {}, JSON.stringify(chatMessage))
    }

    const onError = err => {
        console.log(err)
    }

    const onPublicMessageReceived = (payload) => {
        let payloadData = JSON.parse(payload.body)
        switch (payloadData.status) {
            case "JOIN":
                if(!privateChats.get(payloadData.senderName)) {
                    privateChats.set(payloadData.senderName, [])
                    setPrivateChats(new Map(privateChats))
                }
                break
            case "MESSAGE":
                publicChats.push(payloadData)
                setPublicChats([...publicChats])
                break
            case "LEAVE":
                break
        }
    }

    const onPrivateMessageReceived = (payload) => {
        let payloadData = JSON.parse(payload.body)
        if(privateChats.get(payloadData.senderName)) {
            privateChats.get(payloadData.senderName).push(payloadData);
            setPrivateChats(new Map(privateChats))
        } else {
            let list = []
            list.push(payloadData)
            privateChats.set(payloadData.senderName, list)
            setPrivateChats(new Map(privateChats))
        }
    }

    const sendPublicMessage = () => {
        if (stompClient) {
            let chatMessage = {
                senderName: userData.username,
                message: userData.message,
                status: "MESSAGE"
            }
            stompClient.send(`/app/message`, {}, JSON.stringify(chatMessage))
            setUserData({...userData, "message": ""})
        }
    }

    const sendPrivateMessage = () => {
        if (stompClient) {
            let chatMessage = {
                senderName: userData.username,
                receiverName: tab,
                message: userData.message,
                status: "MESSAGE"
            }
            if (userData.username !== tab) {
                privateChats.get(tab).push(chatMessage)
                setPrivateChats(new Map(privateChats))
            }
            stompClient.send(`/app/private-message`, {}, JSON.stringify(chatMessage))
            setUserData({...userData, "message": ""})
        }
    }

    useEffect(() => {
        console.log(userData)
        console.log(publicChats)
        console.log(privateChats)
        console.log(tab)
    })

    return (
        <div className="container">
            {userData.connected ?
                                <div className="chat-box">
                                    <div className="member-list">
                                        <ul>
                                            <li 
                                            onClick={() => setTab("ChatRoom")}
                                            className={`member ${tab === "ChatRoom" && "active"}`}
                                            >
                                                Chatroom
                                            </li>
                                            {
                                                [...privateChats.keys()].map((name, i) => {
                                                    return (
                                                        <li 
                                                        onClick={() => setTab(name)}
                                                        key={i} 
                                                        className={`member ${tab === name && "active"}`}
                                                        >
                                                            {name}
                                                        </li>
                                                    )
                                                })
                                            }
                                        </ul>
                                    </div>
                                    {tab === "ChatRoom" && <div className="chat-content">
                                        <ul className="chat-messages">
                                        {
                                            
                                            publicChats.map((chat, i) => {
                                                return (
                                                    <li className="message" key={i}>
                                                        {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                                        <div className="message-data">{chat.message}</div>
                                                        {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                                                    </li>
                                                )
                                            })
                                        }
                                        </ul>

                                        <div className="send-message">
                                            <input 
                                            type="text" 
                                            className="input-message"
                                            name="message"
                                            placeholder="enter public message" 
                                            value={userData.message}
                                            onChange={handleValue}
                                            />
                                            <button className="send-button" onClick={sendPublicMessage}>send</button>
                                        </div>
                                    </div>}
                                    {tab !== "ChatRoom" && <div className="chat-content">
                                        <ul className="chat-messages">
                                        {
                                            [...privateChats.get(tab)].map((chat, i) => {
                                                return (
                                                    <li className="message" key={i}>
                                                        {chat.senderName !== userData.username && <div className="avatar">{chat.senderName}</div>}
                                                        <div className="message-data">{chat.message}</div>
                                                        {chat.senderName === userData.username && <div className="avatar self">{chat.senderName}</div>}
                                                    </li>
                                                )
                                            })
                                        }
                                        </ul>

                                        <div className="send-message">
                                            <input 
                                            type="text" 
                                            className="input-message"
                                            name="message"
                                            placeholder={`enter private message for ${tab}`} 
                                            value={userData.message}
                                            onChange={handleValue}
                                            />
                                            <button className="send-button" onClick={sendPrivateMessage}>send</button>
                                        </div>
                                    </div>}
                                </div>
                                :
                                <div className="register">  
                                    <input
                                    id="user-name"
                                    name="username"
                                    placeholder="Enter the user name"
                                    value={userData.username}
                                    onChange={handleValue}
                                    />
                                    <button type="button" onClick={registerUser}>
                                        Connect
                                    </button>
                                </div>
            }
        </div>
    )
}

export default ChatRoom