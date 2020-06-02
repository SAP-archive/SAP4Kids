self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open("ui5-store").then(function (cache) {
      return cache.addAll([
        "/comsap4kidsresourcelocator/resources/img/markers/childcare_pin.svg",
        "/comsap4kidsresourcelocator/resources/img/markers/financial_pin.svg",
        "/comsap4kidsresourcelocator/resources/img/markers/food_pin.svg",
        "/comsap4kidsresourcelocator/resources/img/markers/healthcare_pin.svg",
        "/comsap4kidsresourcelocator/resources/img/markers/multiple_pin.svg",
        "/comsap4kidsresourcelocator/resources/img/markers/shelter_pin.svg",
        "/comsap4kidsresourcelocator/resources/img/markers/workforce_pin.svg",
        "/comsap4kidsresourcelocator/resources/img/markers/user.png",
        "/comsap4kidsresourcelocator/resources/img/logo.png",
        "/comsap4kidsresourcelocator/resources/img/header.jpg",
        "/comsap4kidsresourcelocator/resources/img/favicon.ico",
        "/comsap4kidsresourcelocator/resources/keys.js",
        "/comsap4kidsresourcelocator/css/splash.css",
        "/comsap4kidsresourcelocator/css/style.css"
      ]);
    })
  );
});

self.addEventListener("fetch", function (e) {
  e.respondWith(
    caches.match(e.request).then(function (response) {
      return response || fetch(e.request);
    })
  );
});
