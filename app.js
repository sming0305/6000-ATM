let data = [];

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


loadingBackground = document.querySelector(".loadingBackground");

const R = 6371; // 地球半徑
const distance = 2; // 距離

let lat = 25.032;
let lng = 121.523;

const deltaLat = (distance / R) * (180 / Math.PI);
const deltaLng =
  ((distance / R) * (180 / Math.PI)) / Math.cos((lat * Math.PI) / 180);

let swLat = lat - deltaLat;
let swLng = lng - deltaLng;
let neLat = lat + deltaLat;
let neLng = lng + deltaLng;

axios
  .get("https://atm-6000.onrender.com/data")
  .then((res) => {
    data = res.data;

    initMap();
    spinner.stop();
    loadingBackground.setAttribute("class", "d-none");
  })
  .catch((err) => {
    console.log(err);
  });

function initMap() {
  let filteredData = data.filter((item) => {
    if (
      item.座標Y軸 >= swLat &&
      item.座標Y軸 <= neLat &&
      item.座標X軸 >= swLng &&
      item.座標X軸 <= neLng
    ) {
      // 這個地標在範圍內
      return {
        lat: item.座標Y軸,
        lng: item.座標X軸,
      };
    }
  });

  let locations = filteredData.map((item) => {
    return {
      lat: item.座標Y軸,
      lng: item.座標X軸,
    };
  });

  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: { lat, lng },
  });
  const infoWindow = new google.maps.InfoWindow({
    content: "",
    disableAutoPan: true,
  });

  const markers = locations.map((position, i) => {
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

    const marker = new google.maps.Marker({
      position,
      template,
    });

    // markers can only be keyboard focusable when they have click listeners
    // open info window when marker is clicked
    marker.addListener("click", () => {
      infoWindow.setContent(template);
      infoWindow.open(map, marker);
    });
    return marker;
  });

  // Add a marker clusterer to manage the markers.
  const markerCluster = new markerClusterer.MarkerClusterer({ map, markers });

  google.maps.event.addListener(map, "dragend", function () {
    // 獲取地圖中心座標
    const center = map.getCenter();

    // 獲取中心座標的緯度和經度
    lat = center.lat();
    lng = center.lng();

    swLat = lat - deltaLat;
    swLng = lng - deltaLng;
    neLat = lat + deltaLat;
    neLng = lng + deltaLng;

    const filteredData = data.filter((item) => {
      return (
        item.座標Y軸 >= swLat &&
        item.座標Y軸 <= neLat &&
        item.座標X軸 >= swLng &&
        item.座標X軸 <= neLng
      );
    });

    // 將新的資料顯示在地圖上
    const locations = filteredData.map((item) => {
      return {
        lat: item.座標Y軸,
        lng: item.座標X軸,
      };
    });

    markerCluster.clearMarkers();

    markerCluster.addMarkers(
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

window.initMap = initMap;
