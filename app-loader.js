(function(){
  var files = ["app.b64.0", "app.b64.1", "app.b64.2"];
  Promise.all(files.map(function(u){ return fetch(u).then(function(r){ if(!r.ok) throw new Error(u); return r.text(); }); }))
    .then(function(parts){
      var el = document.createElement("script");
      el.text = atob(parts.join(""));
      document.body.appendChild(el);
    })
    .catch(function(e){ console.error("app load failed", e); });
})();
