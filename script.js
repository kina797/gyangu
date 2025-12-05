/* script.js */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// ▼▼▼ 【書き換え1】Firebaseの設定 ▼▼▼
const firebaseConfig = {
  apiKey: "AIzaSyCU5Rq2io8UbqsddFUcYlD0-Cy_J4x1YJE",
  authDomain: "schoolboost-ec0a0.firebaseapp.com",
  projectId: "schoolboost-ec0a0",
  storageBucket: "schoolboost-ec0a0.firebasestorage.app",
  messagingSenderId: "606065168756",
  appId: "1:606065168756:web:9953e52bf09228a4495c21",
};
// ▲▲▲ ここまで ▲▲▲

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 学校の設定
const schoolLocation = {
  lat: 34.69901121238893,
  lng: 135.19325247730316,
};
const schoolRadius = 200;

// ▼▼▼ 変更：確率(probability)を追加しました ▼▼▼
// 合計が100になるように設定すると分かりやすいですが、100でなくても動きます
const gachaItems = [
  // N (合計74%)
  {
    image: "images/40.jpeg",
    name: "Normal",
    rarity: "Normal",
    probability: 39,
  },
  {
    image: "images/35.jpeg",
    name: "Normal",
    rarity: "Normal",
    probability: 35,
  },

  // R (10%)
  {
    image: "images/11.jpeg",
    name: "Rare",
    rarity: "Rare",
    probability: 10,
  },

  // SR (10%)
  { image: "images/10.jpeg", name: "SR", rarity: "SR", probability: 10 },

  // SSR (5%)
  {
    image: "images/5.jpeg",
    name: "SSR",
    rarity: "SSR",
    probability: 5,
  },
  //UR(1%)
  {
    image: "images/1.jpeg",
    name: "GR（ギャングレア）",
    rarity: "GR",
    probability: 1,
  },
];
// ▲▲▲ ここまで ▲▲▲

// --- 認証機能 ---

window.loginWithGoogle = function () {
  signInWithPopup(auth, provider)
    .then((result) => {
      // 成功時はonAuthStateChangedが動く
    })
    .catch((error) => {
      console.error("Login Failed", error);
      alert("ログイン失敗: " + error.message);
    });
};

window.logout = function () {
  signOut(auth).then(() => {
    location.reload();
  });
};

onAuthStateChanged(auth, (user) => {
  const loginScreen = document.getElementById("login-screen");
  const mainApp = document.getElementById("main-app");
  const errorMsg = document.getElementById("login-error");

  if (user) {
    const email = user.email;
    const domain = email.split("@")[1];

    // 学校ドメインチェック
    // テスト用： || domain === 'gmail.com'
    if (domain === "st.kobedenshi.ac.jp") {
      loginScreen.style.display = "none";
      mainApp.style.display = "block";
      document.getElementById("display-name").textContent = user.displayName;
      updateClassTree();
    } else {
      errorMsg.textContent =
        "このアカウントは使用できません（学校のアカウントを使用してください）";
      errorMsg.style.display = "block";
      signOut(auth);
    }
  } else {
    loginScreen.style.display = "flex";
    mainApp.style.display = "none";
  }
});

// --- メイン機能 ---

window.initApp = function () {
  loadCollection();
  setupEventListeners();

  if (navigator.geolocation) {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.watchPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(userLocation),
          new google.maps.LatLng(schoolLocation)
        );
        updateScreen(distance);
      },
      (error) => {
        let errorMsg = "位置情報が取得できませんでした";
        switch (error.code) {
          case 1:
            errorMsg = "位置情報の利用が許可されていません";
            break;
          case 2:
            errorMsg = "電波状況が悪く位置が特定できません";
            break;
          case 3:
            errorMsg = "タイムアウトしました（再読み込みしてください）";
            break;
        }
        document.getElementById("status-text").textContent = errorMsg;
        console.error("Geolocation Error:", error);
      },
      options
    );
  } else {
    document.getElementById("status-text").textContent =
      "GPSに対応していません";
  }
};

function setupEventListeners() {
  const checkinBtn = document.getElementById("checkin-btn");
  if (checkinBtn) checkinBtn.addEventListener("click", showGachaMachine);

  const handleContainer = document.getElementById("gacha-handle-container");
  if (handleContainer)
    handleContainer.addEventListener("click", playGachaAnimation);
}

function updateScreen(distance) {
  const statusText = document.getElementById("status-text");
  const checkinBtn = document.getElementById("checkin-btn");
  const resultArea = document.getElementById("result-area");
  const machine = document.getElementById("gacha-machine");

  if (resultArea.style.display === "block" || machine.style.display === "block")
    return;

  if (distance <= schoolRadius) {
    statusText.innerHTML = "学校に到着しました！<br>お疲れ様です！";
    checkinBtn.style.display = "inline-block";
  } else {
    statusText.innerHTML = `学校まであと <span class="distance-display">${Math.round(
      distance
    )}m</span>`;
    checkinBtn.style.display = "none";
  }
}

function showGachaMachine() {
  document.getElementById("checkin-btn").style.display = "none";
  document.getElementById("status-text").style.display = "none";
  document.getElementById("gacha-machine").style.display = "block";
}

let isSpinning = false;
function playGachaAnimation() {
  if (isSpinning) return;
  isSpinning = true;

  const machine = document.getElementById("gacha-machine");
  const handle = document.getElementById("gacha-handle");

  handle.classList.add("spinning");

  setTimeout(() => {
    handle.classList.remove("spinning");
    machine.style.display = "none";
    isSpinning = false;

    // ▼▼▼ 変更：確率に基づいてアイテムを選ぶ関数を使用 ▼▼▼
    const randomItem = selectItemByProbability(gachaItems);

    document.getElementById("item-image").src = randomItem.image;
    document.getElementById("item-name").textContent = randomItem.name;
    document.getElementById("result-area").style.display = "block";

    saveToCollection(randomItem);
  }, 1600);
}

// ▼▼▼ 新規追加：確率計算ロジック ▼▼▼
function selectItemByProbability(items) {
  // 1. 全ての確率の合計値を計算（例：100）
  let totalProbability = 0;
  for (let i = 0; i < items.length; i++) {
    totalProbability += items[i].probability;
  }

  // 2. 0 〜 合計値 の間でランダムな数値を決める
  let random = Math.random() * totalProbability;

  // 3. アイテムを順番に見ていき、ランダム数値が範囲内かチェック
  for (let i = 0; i < items.length; i++) {
    if (random < items[i].probability) {
      return items[i]; // 当たり！
    }
    // 範囲外なら、現在の確率分を引いて次のアイテムへ
    random -= items[i].probability;
  }

  // 万が一のための保険（最後のアイテムを返す）
  return items[items.length - 1];
}
// ▲▲▲ ここまで ▲▲▲

function updateClassTree() {
  const fakeAttendance = Math.floor(Math.random() * (100 - 60) + 60);
  document.getElementById("rate-value").textContent = fakeAttendance;
  const treeIcon = document.getElementById("tree-icon");
  const treeMsg = document.getElementById("tree-message");

  if (fakeAttendance < 30) {
    treeIcon.textContent = "🌱";
    treeMsg.textContent = "まだ登校している人は少ないようです...";
  } else if (fakeAttendance < 70) {
    treeIcon.textContent = "🌿";
    treeMsg.textContent = "クラスのみんなが集まってきました！";
  } else {
    treeIcon.textContent = "🌸";
    treeMsg.textContent = "素晴らしい！クラスは活気に満ちています！";
  }
}

function saveToCollection(item) {
  let collection = JSON.parse(localStorage.getItem("myCollection")) || [];
  collection.push(item);
  localStorage.setItem("myCollection", JSON.stringify(collection));
  loadCollection();
}

function loadCollection() {
  const listContainer = document.getElementById("collection-list");
  const collection = JSON.parse(localStorage.getItem("myCollection")) || [];

  if (collection.length === 0) {
    listContainer.innerHTML = '<p class="empty-msg">まだ何もありません</p>';
    return;
  }
  listContainer.innerHTML = "";
  collection.forEach((item) => {
    const itemElement = document.createElement("div");
    itemElement.className = "collection-item";

    if (item.image) {
      const img = document.createElement("img");
      img.src = item.image;
      img.className = "collection-img-mini";
      itemElement.appendChild(img);
    } else {
      itemElement.textContent = item.icon || "?";
    }

    listContainer.appendChild(itemElement);
  });
}

// ▼▼▼ 【書き換え2】Google Maps API読み込み ▼▼▼
function loadGoogleMapsAPI() {
  if (window.google && window.google.maps) return;

  const script = document.createElement("script");
  // YOUR_API_KEY を書き換えてください
  script.src =
    "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initApp&libraries=geometry";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

loadGoogleMapsAPI();
