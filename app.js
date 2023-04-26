// 存放網路請求ATM地點
let data = [];

// Loading 圖標設定 (spin.js)
let opts = {
    lines: 13,
    length: 30,
    width: 14,
    radius: 42,
    scale: 0.6,
    corners: 1,
    color: "#ff3600",
    opacity: 0.5,
    rotate: 0,
    direction: 1,
    speed: 1,
    trail: 60,
    fps: 20,
    zIndex: 2e9,
    className: "spinner",
    top: "36%",
    left: "50%",
    shadow: false,
    hwaccel: false,
    position: "absolute",
  },
  target = document.getElementById("spinner"),
  spinner = new Spinner(opts).spin(target);

// Loading 背景
loadingBackground = document.querySelector(".loadingBackground");

const R = 6371; // 地球半徑-公里(實際約為6,357km到6,378km)
const distance = 2; // 每次搜尋並顯示ATM的範圍邊長

//地圖初始中心點之經緯度
let lat = 25.032;
let lng = 121.523;

// 距離單位與角度單位換算,計算出偏移度數 (緯度和經度的單位是角度，距離的單位是公里)
const deltaLat = (distance / R) * (180 / Math.PI);
const deltaLng =
  ((distance / R) * (180 / Math.PI)) / Math.cos((lat * Math.PI) / 180);

//  計算出南西角座標（swLat, swLng）、東北角座標（neLat, neLng）。
let swLat = lat - deltaLat;
let swLng = lng - deltaLng;
let neLat = lat + deltaLat;
let neLng = lng + deltaLng;

// 取得ATM地點資料集
axios
  .get("https://atm-6000.onrender.com/data")
  .then((res) => {
    data = res.data;
    // 取得資料後地圖初始化 , loading結束 , loading背景消除
    initMap();
    spinner.stop();
    loadingBackground.setAttribute("class", "d-none");
  })
  .catch((err) => {
    console.log(err);
  });

// Google Map 初始化函式
function initMap() {
  // 整理出符合地圖中心點向外3*3公里的ATM資料集
  let filteredData = data.filter((item) => {
    if (
      item.座標Y軸 >= swLat &&
      item.座標Y軸 <= neLat &&
      item.座標X軸 >= swLng &&
      item.座標X軸 <= neLng
    ) {
      return {
        lat: item.座標Y軸,
        lng: item.座標X軸,
      };
    }
  });

  // 將3*3公里ATM資料集整理成Google Map 叢集markers較易使用的格式
  let locations = filteredData.map((item) => {
    return {
      lat: item.座標Y軸,
      lng: item.座標X軸,
    };
  });

  // 創建一個Google Map, zoom 等級 10
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: { lat, lng },
  });
  // 地圖標記資訊
  const infoWindow = new google.maps.InfoWindow({
    content: "",
    disableAutoPan: true,
  });

  // 將ATM地點轉換為markers陣列，並替每個marker添加內容,位置,綁定點擊事件
  const markers = locations.map((position, i) => {
    // 每一個地點的說明
    const template = `
    <div class="p-1 rounded-1">
    <h2 class="fs-4 fw-bold">ATM名稱 : ${filteredData[i].裝設地點}</h2>
    <p class="text-danger fs-6 fw-bold">${
      filteredData[i].備註 === undefined ? "" : filteredData[i].備註
    }</p>
    <ul class="list-unstyled">
    <li class="fs-6 mb-1">
    所屬銀行 : ${filteredData[i].所屬銀行簡稱}
        </li>
        <li class="fs-6 mb-1">
            連絡電話 : (0${filteredData[i].區碼})-${filteredData[i].聯絡電話}
        </li>
        <li class="fs-6 mb-1">
            地址 : ${filteredData[i].所屬縣市}${filteredData[i].鄉鎮縣市別}${
      filteredData[i].地址
    }
        </li>
        <li class="fs-6 mb-1">符合輪椅使用 : ${
          filteredData[i].符合輪椅使用 === "V" ? "是" : "否"
        }</li>
        <li class="fs-6 mb-1">符合輪椅使用且環境亦符合 : ${
          filteredData[i].符合輪椅使用且環境亦符合 === "V" ? "是" : "否"
        }</li>
    </ul>
    </div>`;

    // 創建marker (位置position ,template內容)
    const marker = new google.maps.Marker({
      position,
      template,
    });

    // markers can only be keyboard focusable when they have click listeners
    // open info window when marker is clicked
    // 替每個marker 綁定點擊，點擊後觸發其內容
    marker.addListener("click", () => {
      infoWindow.setContent(template);
      infoWindow.open(map, marker);
    });
    return marker;
  });

  // Add a marker clusterer to manage the markers.  創建叢集地圖，使用整理好的 markers陣列
  const markerCluster = new markerClusterer.MarkerClusterer({ map, markers });

  // 替Google Map 綁定 "拖曳結束"事件
  // 當"拖曳結束時"觸發以下內容，重新計算並顯示該區域內的ATM地標
  google.maps.event.addListener(map, "dragend", function () {
    // 獲取地圖中心座標
    const center = map.getCenter();

    // 獲取中心座標的緯度和經度
    lat = center.lat();
    lng = center.lng();

    // 重新計算出南西角座標（swLat, swLng）、東北角座標（neLat, neLng）。
    swLat = lat - deltaLat;
    swLng = lng - deltaLng;
    neLat = lat + deltaLat;
    neLng = lng + deltaLng;

    // 重新整理出符合地圖中心點向外3*3公里的ATM資料集
    const filteredData = data.filter((item) => {
      return (
        item.座標Y軸 >= swLat &&
        item.座標Y軸 <= neLat &&
        item.座標X軸 >= swLng &&
        item.座標X軸 <= neLng
      );
    });

    // 重新整理出叢集markers較易使用的格式
    const locations = filteredData.map((item) => {
      return {
        lat: item.座標Y軸,
        lng: item.座標X軸,
      };
    });

    // 清除拖曳前的地標集
    markerCluster.clearMarkers();

    // 添加重新計算過的地標集
    markerCluster.addMarkers(
      // 此處結果獲得一個新的markers陣列，內含每個marker的地點經緯度及說明內容。
      locations.map((position, i) => {
        const template = `
        <div class="p-1 rounded-1">
        <h2 class="fs-4 fw-bold">ATM名稱 : ${filteredData[i].裝設地點}</h2>
        <p class="text-danger fs-6 fw-bold">${
          filteredData[i].備註 === undefined ? "" : filteredData[i].備註
        }</p>
        <ul class="list-unstyled">
        <li class="fs-6 mb-1">
        所屬銀行 : ${filteredData[i].所屬銀行簡稱}
            </li>
            <li class="fs-6 mb-1">
                連絡電話 : (0${filteredData[i].區碼})-${
          filteredData[i].聯絡電話
        }
            </li>
            <li class="fs-6 mb-1">
                地址 : ${filteredData[i].所屬縣市}${
          filteredData[i].鄉鎮縣市別
        }${filteredData[i].地址}
            </li>
            <li class="fs-6 mb-1">符合輪椅使用 : ${
              filteredData[i].符合輪椅使用 === "V" ? "是" : "否"
            }</li>
            <li class="fs-6 mb-1">符合輪椅使用且環境亦符合 : ${
              filteredData[i].符合輪椅使用且環境亦符合 === "V" ? "是" : "否"
            }</li>
        </ul>
        </div>`;
        const marker = new google.maps.Marker({
          position,
          template,
        });
        marker.addListener("click", () => {
          infoWindow.setContent(template);
          infoWindow.open(map, marker);
        });
        return marker;
      })
    );
  });
}

// 地圖初始化
window.initMap = initMap;
