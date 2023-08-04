package com.WebsocketApp.ChatApp.controller;

import com.WebsocketApp.ChatApp.model.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

@Controller
public class ChatController {
    private SimpMessagingTemplate simpMessagingTemplate;
    @Autowired
    public ChatController(SimpMessagingTemplate simpMessagingTemplate) {
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    @MessageMapping("/message")  // /app/message
    @SendTo("/chatroom/public")
    public Message receivePublicMessage(@Payload Message message) {
        return message;
    }

    @MessageMapping("/private-message")
    public Message receivePriveteMessage(@Payload Message message) {
            simpMessagingTemplate.convertAndSendToUser(message.getReceiverName(), "/private", message); // /user/user_name/private
        return message;
    }
}
