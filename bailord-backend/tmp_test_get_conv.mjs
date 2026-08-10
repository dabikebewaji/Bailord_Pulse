import 'dotenv/config';
import { MessageModel } from './src/models/messageModel.js';

(async ()=>{
  try{
    const conv = await MessageModel.getConversations(1);
    console.log('Conversations:', conv);
  }catch(e){
    console.error('Error from getConversations:', e);
    if(e.sql) console.error('SQL:', e.sql);
    if(e.stack) console.error(e.stack);
  }
})();
