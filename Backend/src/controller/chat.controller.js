import db from "../utils/db.js";

// ✅ Create or Get Conversation
export const getOrCreateConversation = (user1, user2) => {
    return new Promise((resolve, reject) => {
        const a = Math.min(user1, user2);
        const b = Math.max(user1, user2);

        db.query(
            "SELECT * FROM conversations WHERE user1_id=? AND user2_id=?",
            [a, b],
            (err, rows) => {
                if (err) return reject(err);

                if (rows.length > 0) return resolve(rows[0]);

                db.query(
                    "INSERT INTO conversations (user1_id, user2_id) VALUES (?,?)",
                    [a, b],
                    (err2, result) => {
                        if (err2) return reject(err2);

                        db.query(
                            "SELECT * FROM conversations WHERE id=?",
                            [result.insertId],
                            (err3, rows2) => {
                                if (err3) return reject(err3);
                                resolve(rows2[0]);
                            }
                        );
                    }
                );
            }
        );
    });
};

// ✅ Save Message in DB
export const saveMessage = (data) => {
    return new Promise((resolve, reject) => {
        const {
            conversation_id,
            sender_id,
            receiver_id,
            message_type,
            text_message,
            file_url,
            file_name,
            file_size,
        } = data;

        db.query(
            `INSERT INTO messages 
      (conversation_id, sender_id, receiver_id, message_type, text_message, file_url, file_name, file_size)
      VALUES (?,?,?,?,?,?,?,?)`,
            [
                conversation_id,
                sender_id,
                receiver_id,
                message_type,
                text_message,
                file_url,
                file_name,
                file_size,
            ],
            (err, result) => {
                if (err) return reject(err);

                // ✅ Update conversation last message tracking
                const lastMsg =
                    message_type === "text"
                        ? text_message
                        : `${message_type}: ${file_name}`;

                db.query(
                    "UPDATE conversations SET last_message=?, last_message_at=NOW() WHERE id=?",
                    [lastMsg, conversation_id],
                    () => { }
                );

                resolve({
                    id: result.insertId,
                    ...data,
                     created_at: new Date(), // ✅ add this
                });
            }
        );
    });
};

// ✅ GET conversations list of user (Tracking)
export const getUserConversations = async (req, res) => {
    const { userId } = req.params;

    db.query(
        `SELECT c.*,
      u1.name AS user1_name,
      u2.name AS user2_name
     FROM conversations c
     JOIN users u1 ON c.user1_id = u1.id
     JOIN users u2 ON c.user2_id = u2.id
     WHERE c.user1_id=? OR c.user2_id=?
     ORDER BY c.last_message_at DESC`,
        [userId, userId],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Error fetching conversations" });
            res.json(rows);
        }
    );
};

// ✅ GET messages of conversation
export const getMessagesByConversation = async (req, res) => {
    const { conversation_id } = req.params;

    db.query(
        "SELECT * FROM messages WHERE conversation_id=? ORDER BY created_at ASC",
        [conversation_id],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Error fetching messages" });
            res.json(rows);
        }
    );
};
