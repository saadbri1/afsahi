/* =================================================================
   AFSAHI LUXURY TRANSPORT — main.js
   Lenis smooth scroll · GSAP/ScrollTrigger · Three.js hero particles
   Custom cursor · FR/EN i18n · booking · fleet slider · count-ups
   ================================================================= */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 860px)").matches;
  document.body.classList.remove("no-js");
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- i18n ---------------- */
  var i18n = {
    fr: {
      brand_tag:"Luxury Transport", nav_home:"Accueil", nav_services:"Services", nav_fleet:"Notre Flotte",
      nav_how:"Comment ça marche", nav_contact:"Contact", nav_book:"Réserver",
      hero_eyebrow:"Casablanca · Rabat · Marrakech · Tanger", hero_title:"Le luxe en mouvement.",
      hero_sub:"Luxury in motion — un service de chauffeur privé à travers le Maroc.",
      hero_lead:"Des transferts aéroport aux trajets sur mesure, AFSAHI conjugue élégance, ponctualité et discrétion absolue.",
      book_transfer:"Transfert", book_hourly:"À l'heure", book_from:"Départ", book_to:"Destination",
      book_date:"Date", book_time:"Heure", book_pax:"Passagers", book_cta:"Voir les prix",
      trust_word:"Excellent", trust_sub:"1 200+ trajets notés", scroll:"Défiler",
      svc_eyebrow:"Nos Services", svc_title:"Deux façons de voyager, une seule exigence",
      svc1_kicker:"Transferts Aéroport", svc1_title:"Accueilli, jamais simplement récupéré",
      svc1_text:"Votre chauffeur suit votre vol en temps réel et vous attend en zone d'arrivée. Bagages pris en charge, habitacle tempéré — vous n'avez qu'à monter.",
      svc1_link:"Réserver un transfert",
      svc2_kicker:"Trajets en Ville", svc2_title:"Votre journée, à votre rythme",
      svc2_text:"Réunions, dîners, événements. Gardez le même véhicule et le même chauffeur à votre entière disposition, à l'heure ou à la demande.",
      svc2_link:"Réserver à l'heure",
      why_eyebrow:"Pourquoi AFSAHI", why_title:"Le standard du voyage privé au Maroc",
      why_text:"Une flotte récente, des chauffeurs formés et un sens du détail qui transforme chaque trajet en expérience.",
      stat1:"Chauffeurs professionnels", stat2:"Véhicules premium", stat3:"Villes desservies", stat4:"Service & conciergerie",
      how_eyebrow:"Comment ça marche", how_title:"Trois étapes vers la sérénité",
      how1_t:"Réservez votre trajet", how1_p:"Indiquez départ, destination et horaire. Le tarif est fixe et confirmé à l'avance.",
      how2_t:"Recevez votre chauffeur", how2_p:"Un professionnel vérifié arrive en avance, suit votre vol et vous accueille par votre nom.",
      how3_t:"Voyagez en toute sérénité", how3_p:"Installez-vous dans un cuir feutré et laissez la route venir à vous.",
      fleet_eyebrow:"Notre Flotte", fleet_title:"Choisies pour leur présence",
      v1_class:"Berline", v2_class:"Première Classe", v3_class:"SUV", v4_class:"Van",
      exp_quote:"Chaque trajet, une expérience signature.", exp_by:"— L'art de voyager, selon AFSAHI",
      rev_eyebrow:"Témoignages", rev_title:"Ils voyagent avec confiance",
      rev1:"« Ponctuels, discrets, impeccables. La seule voiture en qui j'ai confiance avant un vol important. »",
      rev2:"« Un service à la hauteur des plus grandes capitales. Le chauffeur connaissait déjà mon itinéraire. »",
      rev3:"« De l'aéroport à l'hôtel sans un mot de trop. Exactement ce que le luxe devrait être. »",
      city_casa:"Casablanca", city_rabat:"Rabat", city_mrk:"Marrakech",
      dest_eyebrow:"Destinations", dest_title:"Tout le Maroc, entre deux portes",
      news_title:"Réservez votre premier trajet", news_text:"Recevez nos itinéraires signature et offres privées. Discrétion garantie.",
      news_cta:"S'abonner",
      foot_blurb:"Service de chauffeur privé haut de gamme. Le luxe en mouvement, à travers tout le Maroc.",
      foot_services:"Services", foot_airport:"Transferts Aéroport", foot_city:"Trajets en Ville",
      foot_cities:"Villes", foot_contact:"Contact", foot_rights:"Tous droits réservés.",
      _note_book:"Merci — notre conciergerie confirme votre chauffeur sous quelques minutes.",
      _note_news:"Merci — vous êtes inscrit. À très bientôt sur la route."
    },
    en: {
      brand_tag:"Luxury Transport", nav_home:"Home", nav_services:"Services", nav_fleet:"Our Fleet",
      nav_how:"How it works", nav_contact:"Contact", nav_book:"Book Now",
      hero_eyebrow:"Casablanca · Rabat · Marrakech · Tangier", hero_title:"Luxury in motion.",
      hero_sub:"Le luxe en mouvement — a discreet private chauffeur service across Morocco.",
      hero_lead:"From airport transfers to bespoke journeys, AFSAHI unites elegance, punctuality and absolute discretion.",
      book_transfer:"Transfer", book_hourly:"Hourly", book_from:"From", book_to:"To",
      book_date:"Date", book_time:"Time", book_pax:"Passengers", book_cta:"See prices",
      trust_word:"Excellent", trust_sub:"1,200+ rated journeys", scroll:"Scroll",
      svc_eyebrow:"Our Services", svc_title:"Two ways to travel, one standard",
      svc1_kicker:"Airport Transfers", svc1_title:"Met, never merely collected",
      svc1_text:"Your chauffeur tracks your flight in real time and waits in arrivals. Bags handled, cabin chilled — you simply step in.",
      svc1_link:"Book a transfer",
      svc2_kicker:"City Rides", svc2_title:"Your day, at your pace",
      svc2_text:"Meetings, dinners, events. Keep the same car and chauffeur entirely at your disposal, by the hour or on demand.",
      svc2_link:"Book by the hour",
      why_eyebrow:"Why AFSAHI", why_title:"The standard for private travel in Morocco",
      why_text:"A recent fleet, trained chauffeurs and an eye for detail that turns every ride into an experience.",
      stat1:"Professional chauffeurs", stat2:"Premium vehicles", stat3:"Cities served", stat4:"Service & concierge",
      how_eyebrow:"How it works", how_title:"Three steps to stillness",
      how1_t:"Book your ride", how1_p:"Tell us pickup, destination and time. Pricing is fixed and confirmed in advance.",
      how2_t:"Meet your chauffeur", how2_p:"A vetted professional arrives early, tracks your flight and greets you by name.",
      how3_t:"Travel with ease", how3_p:"Settle into quiet leather and let the road come to you.",
      fleet_eyebrow:"Our Fleet", fleet_title:"Chosen for their presence",
      v1_class:"Sedan", v2_class:"First Class", v3_class:"SUV", v4_class:"Van",
      exp_quote:"Every journey, a signature experience.", exp_by:"— The art of travel, by AFSAHI",
      rev_eyebrow:"Testimonials", rev_title:"They travel with confidence",
      rev1:"“Punctual, discreet, impeccable. The only car I trust before a flight I cannot miss.”",
      rev2:"“A service worthy of the great capitals. The chauffeur already knew my itinerary.”",
      rev3:"“From airport to hotel without a word too many. Exactly what luxury should be.”",
      city_casa:"Casablanca", city_rabat:"Rabat", city_mrk:"Marrakech",
      dest_eyebrow:"Destinations", dest_title:"All of Morocco, between two doors",
      news_title:"Book your first ride", news_text:"Receive our signature itineraries and private offers. Discretion guaranteed.",
      news_cta:"Subscribe",
      foot_blurb:"Premium private chauffeur service. Luxury in motion, across all of Morocco.",
      foot_services:"Services", foot_airport:"Airport Transfers", foot_city:"City Rides",
      foot_cities:"Cities", foot_contact:"Contact", foot_rights:"All rights reserved.",
      _note_book:"Thank you — our concierge will confirm your chauffeur within minutes.",
      _note_news:"Thank you — you're subscribed. See you on the road."
    }
  };
  var lang = "fr";
  function applyLang(l) {
    lang = l;
    document.documentElement.lang = l;
    var dict = i18n[l];
    $$("[data-i18n]").forEach(function (el) {
      var k = el.getAttribute("data-i18n");
      if (dict[k] != null) el.textContent = dict[k];
    });
    $$("[data-ph-" + l + "]").forEach(function (el) {
      el.setAttribute("placeholder", el.getAttribute("data-ph-" + l));
    });
    $(".lang__fr").classList.toggle("is-active", l === "fr");
    $(".lang__en").classList.toggle("is-active", l === "en");
  }
  $("#lang").addEventListener("click", function () { applyLang(lang === "fr" ? "en" : "fr"); });
  applyLang("fr");

  /* ---------------- year ---------------- */
  $("#yr").textContent = new Date().getFullYear();

  /* ---------------- navbar scroll ---------------- */
  var nav = $("#nav");
  function navState(y) { nav.classList.toggle("scrolled", y > window.innerHeight * 0.7); }
  navState(window.scrollY);

  /* ---------------- mobile menu ---------------- */
  var burger = $("#burger"), navLinks = $("#navLinks");
  burger.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    burger.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", open);
  });
  $$("#navLinks a").forEach(function (a) {
    a.addEventListener("click", function () {
      navLinks.classList.remove("open"); burger.classList.remove("open");
      burger.setAttribute("aria-expanded", false);
    });
  });

  /* ---------------- booking widget ---------------- */
  var tabs = $("#bookTabs"), pill = $("#bookPill"), destField = $("[data-dest]");
  $$("[data-tab]", tabs).forEach(function (b, i) {
    b.addEventListener("click", function () {
      $$("[data-tab]", tabs).forEach(function (x) { x.classList.remove("is-active"); });
      b.classList.add("is-active");
      pill.style.transform = "translateX(" + (i * 100) + "%)";
      destField.style.display = i === 1 ? "none" : "";
    });
  });
  var pax = 1, paxVal = $("#paxVal");
  $$("[data-step]").forEach(function (b) {
    b.addEventListener("click", function () {
      pax = Math.min(7, Math.max(1, pax + parseInt(b.getAttribute("data-step"), 10)));
      paxVal.textContent = pax;
    });
  });
  $("#book").addEventListener("submit", function (e) {
    e.preventDefault();
    var n = $("#bookNote"); n.textContent = i18n[lang]._note_book; n.classList.add("show");
  });
  $("#newsForm").addEventListener("submit", function (e) {
    e.preventDefault();
    $("#newsNote").textContent = i18n[lang]._note_news; e.target.reset();
  });

  /* ---------------- custom cursor ---------------- */
  if (!isMobile && window.matchMedia("(hover:hover)").matches) {
    var cur = $("#cursor"), dot = $("#cursorDot");
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px)";
    });
    (function loop() {
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
      cur.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(loop);
    })();
    $$("[data-cursor], a, button").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-hover"); });
    });
  }

  /* ---------------- magnetic hover ---------------- */
  if (!isMobile && !reduce) {
    $$(".magnetic").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = (e.clientX - r.left - r.width / 2) / r.width;
        var my = (e.clientY - r.top - r.height / 2) / r.height;
        el.style.transform = "translate(" + (mx * 12) + "px," + (my * 12) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------------- fleet slider (drag + arrows) ---------------- */
  (function fleet() {
    var vp = $("#fleetViewport"), track = $("#fleetTrack");
    if (!vp || !track) return;
    var x = 0, max = 0, down = false, startX = 0, startPos = 0, moved = false;
    function calc() { max = Math.min(0, vp.clientWidth - track.scrollWidth - 0); }
    function set(v, smooth) {
      x = Math.max(max, Math.min(0, v));
      track.style.transition = smooth ? "transform .6s cubic-bezier(.16,1,.3,1)" : "none";
      track.style.transform = "translateX(" + x + "px)";
    }
    calc(); window.addEventListener("resize", function () { calc(); set(x, true); });
    var step = function () { return Math.min(380, vp.clientWidth * 0.85); };
    $("#fleetNext").addEventListener("click", function () { set(x - step(), true); });
    $("#fleetPrev").addEventListener("click", function () { set(x + step(), true); });
    vp.addEventListener("pointerdown", function (e) {
      down = true; moved = false; startX = e.clientX; startPos = x; vp.classList.add("dragging");
      vp.setPointerCapture(e.pointerId);
    });
    vp.addEventListener("pointermove", function (e) {
      if (!down) return; var d = e.clientX - startX; if (Math.abs(d) > 4) moved = true; set(startPos + d, false);
    });
    function up() { down = false; vp.classList.remove("dragging"); set(x, true); }
    vp.addEventListener("pointerup", up); vp.addEventListener("pointercancel", up);
    vp.addEventListener("click", function (e) { if (moved) e.preventDefault(); }, true);
  })();

  /* ---------------- Lenis smooth scroll ---------------- */
  var lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
    lenis.on("scroll", function (e) { navState(e.scroll); });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href"); if (id.length < 2) return;
        var t = $(id); if (!t) return; e.preventDefault();
        lenis.scrollTo(t, { offset: -10, duration: 1.4 });
      });
    });
  } else {
    window.addEventListener("scroll", function () { navState(window.scrollY); }, { passive: true });
  }

  /* ---------------- GSAP animations ---------------- */
  if (window.gsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) ScrollTrigger.scrollerProxy ? null : null;
    if (lenis) lenis.on("scroll", ScrollTrigger.update);

    if (!reduce) {
      /* split hero title into words */
      var splitEl = $("[data-split]");
      if (splitEl) {
        var words = splitEl.textContent.split(" ");
        splitEl.innerHTML = words.map(function (w) {
          return '<span class="word"><span>' + w + "</span></span>";
        }).join(" ");
      }

      gsap.set(".reveal", { opacity: 0, y: 34 });

      var tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero__media img", { scale: 1.28, opacity: 0, duration: 1.6 })
        .from(".split .word span", { yPercent: 110, opacity: 0, duration: 1, stagger: 0.12 }, "-=1.05")
        .to(".hero__copy .reveal", { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 }, "-=0.8")
        .from("#book", { y: 48, opacity: 0, duration: 1 }, "-=0.7");

      /* hero parallax */
      gsap.to("#heroImg", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      /* experience parallax */
      gsap.fromTo("#expImg", { yPercent: -12 }, { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".exp", start: "top bottom", end: "bottom top", scrub: true } });

      /* generic reveals (skip hero copy already handled) */
      $$(".reveal").forEach(function (el) {
        if (el.closest(".hero__copy")) return;
        gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" } });
      });

      /* count-up stats */
      $$("[data-count]").forEach(function (el) {
        var end = parseFloat(el.getAttribute("data-count"));
        var suf = el.getAttribute("data-suffix") || "";
        ScrollTrigger.create({
          trigger: el, start: "top 90%", once: true,
          onEnter: function () {
            var o = { v: 0 };
            gsap.to(o, { v: end, duration: 1.8, ease: "power2.out",
              onUpdate: function () { el.textContent = Math.round(o.v) + suf; } });
          }
        });
      });
    } else {
      $$(".reveal").forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
      $$("[data-count]").forEach(function (el) { el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || ""); });
    }
  }

  /* ---------------- Three.js hero particles ---------------- */
  (function particles() {
    var canvas = $("#heroCanvas");
    if (!canvas || !window.THREE || reduce || isMobile) return;
    var renderer, scene, camera, points, raf, running = true;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (e) { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 26;

    var N = 380, geo = new THREE.BufferGeometry(), pos = new Float32Array(N * 3), sp = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
      sp[i] = Math.random() * 0.01 + 0.003;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

    function disc() {
      var c = document.createElement("canvas"); c.width = c.height = 64;
      var g = c.getContext("2d"), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, "rgba(232,201,122,1)"); grd.addColorStop(0.4, "rgba(201,168,76,.6)"); grd.addColorStop(1, "rgba(201,168,76,0)");
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
      var t = new THREE.Texture(c); t.needsUpdate = true; return t;
    }
    var mat = new THREE.PointsMaterial({ size: 0.55, map: disc(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 });
    points = new THREE.Points(geo, mat);
    scene.add(points);

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    resize(); window.addEventListener("resize", resize);

    var mx = 0, my = 0;
    window.addEventListener("mousemove", function (e) {
      mx = (e.clientX / window.innerWidth - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
    });

    function animate() {
      if (!running) return;
      var arr = geo.attributes.position.array;
      for (var i = 0; i < N; i++) {
        arr[i * 3 + 1] += sp[i];
        if (arr[i * 3 + 1] > 20) arr[i * 3 + 1] = -20;
      }
      geo.attributes.position.needsUpdate = true;
      points.rotation.y += 0.0006;
      camera.position.x += (mx * 4 - camera.position.x) * 0.04;
      camera.position.y += (-my * 3 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    }
    animate();
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden; if (running) animate();
    });
    /* stop rendering once hero is scrolled past */
    if (window.ScrollTrigger) {
      ScrollTrigger.create({
        trigger: ".hero", start: "bottom top",
        onEnter: function () { running = false; },
        onLeaveBack: function () { running = true; animate(); }
      });
    }
  })();

})();
