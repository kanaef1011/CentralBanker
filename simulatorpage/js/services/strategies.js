// LƯU CHIẾN LƯỢC LÊN FIRESTORE (cơ sở dữ liệu đám mây của Firebase)
// Mỗi người chơi có một "thư mục" riêng theo uid (mã tài khoản do Firebase Auth cấp):
//   users/{uid}/strategies/{id}   ← mỗi chiến lược đã lưu là một document
// Nhờ vậy đăng nhập ở máy nào cũng thấy đúng danh sách của mình.
// File này chỉ nói chuyện với Firebase; phần còn lại của game không cần biết Firebase là gì.

import app from "../../../config.js";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from "firebase/firestore";

const auth = getAuth(app);
const db = getFirestore(app);

// Chờ Firebase cho biết ai đang đăng nhập (null = chưa đăng nhập).
// onAuthStateChanged gọi lại mỗi khi trạng thái đổi; ở đây chỉ cần lần đầu nên gọi stop() ngay.
export function waitForUser() {
  return new Promise((resolve) => {
    const stop = onAuthStateChanged(auth, (user) => {
      stop();
      resolve(user);
    });
  });
}

// Đường dẫn tới danh sách chiến lược của một người chơi.
const strategiesOf = (uid) => collection(db, "users", uid, "strategies");

// Đọc mọi chiến lược của người chơi, cũ nhất trước.
// createdAt chỉ dùng để sắp xếp nên bỏ đi trước khi trả về cho game.
export async function fetchStrategies(uid) {
  const snap = await getDocs(query(strategiesOf(uid), orderBy("createdAt")));
  return snap.docs.map((d) => {
    const { createdAt, ...strategy } = d.data();
    return strategy;
  });
}

// Lưu (hoặc ghi đè) một chiến lược. serverTimestamp() = giờ của máy chủ Firebase.
export function saveStrategy(uid, strategy) {
  return setDoc(doc(strategiesOf(uid), strategy.id), {
    ...strategy,
    createdAt: serverTimestamp(),
  });
}

export function deleteStrategy(uid, id) {
  return deleteDoc(doc(strategiesOf(uid), id));
}

// Lưu nhiều chiến lược trong một lần (batch: thành công hết hoặc không lưu gì).
export function saveStrategies(uid, list) {
  const batch = writeBatch(db);
  list.forEach((s) =>
    batch.set(doc(strategiesOf(uid), s.id), { ...s, createdAt: serverTimestamp() }),
  );
  return batch.commit();
}

export function logout() {
  return signOut(auth);
}
