'use client';

import { useState, useEffect } from "react";

const BLUE = "#1A36E8";
const BLUE_DEEP = "#0F1F8F";
const YELLOW = "#FFD400";
const BEIGE = "#F5F4EF";
const INK = "#0A0A0A";
const GRAY = "#8A8A85";

export default function LandingPage() {
  const openModal = () => {
      window.location.href = "/login";
    };

const [lightbox, setLightbox] = useState<string | null>(null);
const [showPromo, setShowPromo] = useState(false);

// 프리런칭 이벤트 팝업 (오늘 하루 보지 않기)
useEffect(() => {
  try {
    const hideUntil = localStorage.getItem("promo_hide_until");
    if (!hideUntil || new Date().getTime() > Number(hideUntil)) {
      setShowPromo(true);
    }
  } catch {
    setShowPromo(true);
  }
}, []);

const closePromoToday = () => {
  try {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0); // 오늘 자정까지
    localStorage.setItem("promo_hide_until", String(tomorrow.getTime()));
  } catch {}
  setShowPromo(false);
};

  // 스크롤 리빌
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("in"), (i % 3) * 90);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@400;600;800;900&family=Gothic+A1:wght@400;500;700;800;900&display=swap');

        .lp * { margin: 0; padding: 0; box-sizing: border-box; }
        .lp { font-family: 'Gothic A1', sans-serif; background: ${BEIGE}; color: ${INK}; overflow-x: hidden; }
        .lp .mono { font-family: 'Archivo', sans-serif; }

        /* NAV */
        .lp nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 48px; mix-blend-mode: difference;
        }
        .lp nav .logo {
          font-family: 'Archivo', sans-serif; font-weight: 900; font-size: 22px;
          letter-spacing: -0.5px; color: #fff; display: flex; align-items: center; gap: 8px;
        }
        .lp nav .logo .box { width: 16px; height: 16px; border: 2.5px solid #fff; display: inline-block; }
        .lp nav .nav-cta {
          color: #fff; text-decoration: none; font-size: 13px; font-weight: 700;
          letter-spacing: 0.5px; border: 1.5px solid #fff; padding: 9px 22px; border-radius: 100px;
          cursor: pointer; background: transparent;
        }

        /* HERO */
        .lp .hero {
          min-height: 100vh; display: flex; flex-direction: column;
          justify-content: center; align-items: center; position: relative;
          padding: 100px 24px 110px; overflow: hidden;
          background: ${BEIGE};
        }
        .lp .hero-img {
          width: 100%; max-width: 1500px; height: auto; display: block;
          margin-bottom: 24px; position: relative; z-index: 2;
          opacity: 0; animation: lpFadeUp 0.9s ease 0.15s forwards;
        }
        .lp .hero-tag {
          font-family: 'Archivo', sans-serif; font-size: 12px; font-weight: 700;
          letter-spacing: 3px; color: ${BLUE}; border: 1.5px solid ${BLUE};
          border-radius: 100px; padding: 8px 20px; margin-bottom: 24px;
          background: rgba(245,244,239,0.7); opacity: 0;
          animation: lpFadeUp 0.8s ease 0.3s forwards; z-index: 2;
        }
        .lp .hero h1 {
          font-family: 'Gothic A1', sans-serif; font-weight: 900;
          font-size: clamp(32px, 5.2vw, 64px); line-height: 1.3; text-align: center;
          letter-spacing: -0.5px; color: ${INK}; position: relative; z-index: 2;
        }
        .lp .hero h1 .line { display: block; overflow: hidden; padding: 2px 0; }
        .lp .hero h1 .line span {
          display: inline-block; transform: translateY(110%);
          animation: lpRevealUp 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .lp .hero h1 .line:nth-child(1) span { animation-delay: 0.4s; }
        .lp .hero h1 .line:nth-child(2) span { animation-delay: 0.55s; }
        .lp .hero h1 .blue { color: ${BLUE}; }
        .lp .hero-sub {
          margin-top: 22px; font-size: clamp(14px, 1.6vw, 18px); font-weight: 600;
          color: #555; text-align: center; line-height: 1.7; max-width: 500px;
          opacity: 0; animation: lpFadeUp 0.8s ease 0.8s forwards; z-index: 2;
        }
        .lp .hero-cta {
          margin-top: 34px; display: flex; gap: 16px;
          opacity: 0; animation: lpFadeUp 0.8s ease 1s forwards; z-index: 2;
        }
        .lp .hero-nav {
          margin-bottom: 28px; display: flex; gap: 8px; flex-wrap: nowrap; justify-content: center;
          opacity: 0; animation: lpFadeUp 0.8s ease 0.3s forwards; z-index: 2;
        }
        .lp .hero-nav button {
          font-family: 'Archivo', sans-serif; font-size: clamp(9px, 2.6vw, 12px); font-weight: 800;
          letter-spacing: 0.5px; color: ${BLUE}; background: rgba(255,255,255,0.7);
          border: 1.5px solid ${BLUE}; border-radius: 100px; padding: 8px clamp(10px, 3vw, 20px);
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .lp .hero-nav button:hover { background: ${BLUE}; color: #fff; }
        .lp .btn-primary {
          background: ${BLUE}; color: #fff; border: none; font-family: 'Gothic A1', sans-serif;
          font-weight: 800; font-size: 17px; padding: 18px 44px; border-radius: 100px;
          cursor: pointer; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s;
          box-shadow: 0 8px 28px rgba(26,54,232,0.32);
        }
        .lp .btn-primary:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 14px 36px rgba(26,54,232,0.42); }

        .lp .hero-strip {
          position: absolute; bottom: 0; left: 0; right: 0; height: 60px;
          background: ${YELLOW}; display: flex; align-items: center; overflow: hidden; z-index: 3;
        }
        .lp .hero-strip .marquee { display: flex; white-space: nowrap; animation: lpMarquee 22s linear infinite; }
        .lp .hero-strip .marquee span {
          font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 14px;
          letter-spacing: 2px; color: ${INK}; padding: 0 28px;
          display: flex; align-items: center; gap: 28px;
        }
        .lp .hero-strip .marquee span::after { content: "◆"; color: ${BLUE}; font-size: 9px; }

        /* HOW IT WORKS */
        .lp .howto { background: ${BEIGE}; padding: 130px 48px; }
        .lp .howto-inner { max-width: 1080px; margin: 0 auto; }
        .lp .howto .head { text-align: center; margin-bottom: 56px; }
        .lp .howto .section-label { color: ${BLUE}; opacity: 1; }
        .lp .howto h2 { font-family: 'Gothic A1', sans-serif; font-weight: 900; letter-spacing: -0.5px; font-size: clamp(30px, 4.2vw, 56px); color: ${INK}; line-height: 1.15; margin-top: 14px; }
        .lp .howto-lead { font-size: clamp(14px, 1.6vw, 17px); font-weight: 600; color: #555; margin-top: 14px; }
        .lp .howto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
        .lp .howto-card { border-radius: 22px; padding: 40px 34px; display: flex; flex-direction: column; transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s; }
        .lp .howto-card:hover { transform: translateY(-8px); }
        .lp .howto-a { background: ${BLUE}; color: #fff; box-shadow: 0 10px 30px rgba(26,54,232,0.25); }
        .lp .howto-a:hover { box-shadow: 0 18px 44px rgba(26,54,232,0.38); }
        .lp .howto-b { background: ${YELLOW}; color: ${BLUE_DEEP}; box-shadow: 0 10px 30px rgba(255,212,0,0.3); }
        .lp .howto-b:hover { box-shadow: 0 18px 44px rgba(255,212,0,0.45); }
        .lp .howto-tag { font-family: 'Archivo', sans-serif; font-size: 12px; font-weight: 800; letter-spacing: 1.5px; margin-bottom: 18px; opacity: 0.85; }
        .lp .howto-a .howto-tag { color: ${YELLOW}; opacity: 1; }
        .lp .howto-b .howto-tag { color: ${BLUE_DEEP}; }
        .lp .howto-card h3 { font-family: 'Gothic A1', sans-serif; font-weight: 900; font-size: clamp(22px, 2.8vw, 30px); line-height: 1.25; letter-spacing: -0.5px; margin-bottom: 16px; word-break: keep-all; }
        .lp .howto-desc { font-size: 15px; line-height: 1.7; font-weight: 500; margin-bottom: 24px; word-break: keep-all; }
        .lp .howto-a .howto-desc { font-weight: 500; }
        .lp .howto-b .howto-desc { font-weight: 700; }
        .lp .howto-a .howto-desc { color: rgba(255,255,255,0.9); }
        .lp .howto-a .howto-desc strong { color: #fff; }
        .lp .howto-b .howto-desc { color: ${BLUE_DEEP}; }
        .lp .howto-b .howto-desc strong { color: ${BLUE_DEEP}; }
        .lp .howto-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; margin-bottom: 16px; }
        .lp .howto-flow span { font-size: 12.5px; font-weight: 700; padding: 6px 12px; border-radius: 100px; white-space: nowrap; }
        .lp .howto-a .howto-flow span { background: rgba(255,255,255,0.16); color: #fff; }
        .lp .howto-b .howto-flow span { background: rgba(15,31,143,0.1); color: ${BLUE_DEEP}; font-weight: 800; }
        .lp .howto-flow i { font-style: normal; font-size: 12px; opacity: 0.5; }
        .lp .howto-note { font-size: 12.5px; font-weight: 600; margin-bottom: 26px; opacity: 0.75; word-break: keep-all; line-height: 1.6; }
        .lp .howto-b .howto-note { font-weight: 700; opacity: 0.9; }
        .lp .howto-card .howto-btn { margin-top: auto; display: block; width: 100%; text-align: center; font-family: 'Gothic A1', sans-serif; font-weight: 800; font-size: 15px; padding: 16px 0; border-radius: 100px; border: none; cursor: pointer; text-decoration: none; transition: transform 0.2s; }
        .lp .howto-card .howto-btn:hover { transform: scale(1.02); }
        .lp .howto-btn-a { background: #fff; color: ${BLUE}; }
        .lp .howto-btn-b { background: ${INK}; color: #fff; }

        /* MODULE */
        .lp .module { background: ${BLUE}; color: #fff; padding: 140px 48px; position: relative; overflow: hidden; }
        .lp .module::before {
          content: ""; position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 54px 54px;
        }
        .lp .module-inner { max-width: 1100px; margin: 0 auto; position: relative; z-index: 2; }
        .lp .section-label { font-family: 'Archivo', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 3px; opacity: 0.6; margin-bottom: 20px; }
        .lp .module h2 { font-family: 'Gothic A1', sans-serif; font-weight: 900; letter-spacing: -0.5px; font-size: clamp(36px, 5vw, 72px); line-height: 1.05; margin-bottom: 60px; }
        .lp .module h2 .yellow { color: ${YELLOW}; }
        .lp .module-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .lp .mod-card { border: 1.5px solid rgba(255,255,255,0.25); border-radius: 14px; padding: 32px; transition: background 0.3s, transform 0.3s; }
        .lp .mod-card:hover { background: rgba(255,255,255,0.08); transform: translateY(-6px); }
        .lp .mod-card .num { font-family: 'Archivo', sans-serif; font-weight: 900; font-size: 40px; color: ${YELLOW}; margin-bottom: 18px; }
        .lp .mod-card h3 { font-size: 21px; font-weight: 800; margin-bottom: 12px; }
        .lp .mod-card p { font-size: 15px; line-height: 1.7; opacity: 0.75; font-weight: 500; }

        /* GALLERY */
        .lp .gallery { background: ${BEIGE}; padding: 140px 48px; }
        .lp .gallery-inner { max-width: 1200px; margin: 0 auto; }
        .lp .gallery .head { text-align: center; margin-bottom: 70px; }
        .lp .gallery .section-label { color: ${BLUE}; opacity: 1; }
        .lp .gallery h2 { font-family: 'Gothic A1', sans-serif; font-weight: 900; letter-spacing: -0.5px; font-size: clamp(34px, 4.5vw, 64px); color: ${INK}; line-height: 1.1; margin-top: 16px; }
        .lp .gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .lp .gal-item {
          position: relative; border-radius: 16px; overflow: hidden; aspect-ratio: 3/4;
          background: #e3e2dc; border: 1.5px solid rgba(10,10,10,0.08);
          display: flex; flex-direction: column; justify-content: flex-end;
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1); cursor: pointer;
        }
        .lp .gal-item:hover { transform: translateY(-8px); }
        .lp .gal-item .ph {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 1px; color: ${GRAY};
          background: repeating-linear-gradient(45deg, transparent, transparent 16px, rgba(10,10,10,0.025) 16px, rgba(10,10,10,0.025) 17px);
        }
        .lp .gal-item .cap { position: relative; z-index: 2; padding: 24px; background: linear-gradient(to top, rgba(10,10,10,0.78), transparent); color: #fff; }
        .lp .gal-item .cap .t { font-weight: 800; font-size: 18px; }
        .lp .gal-item .cap .d { font-size: 13px; opacity: 0.85; margin-top: 4px; font-weight: 500; }
        .lp .gal-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .lp .size-pic { width: 100%; height: 100%; object-fit: cover; border-radius: 12px; }

        /* PRICING */
        .lp .pricing { background: ${INK}; color: #fff; padding: 140px 48px; }
        .lp .pricing-inner { max-width: 1000px; margin: 0 auto; }
        .lp .pricing .head { text-align: center; margin-bottom: 64px; }
        .lp .pricing .section-label { color: ${YELLOW}; opacity: 1; }
        .lp .pricing h2 { font-family: 'Gothic A1', sans-serif; font-weight: 900; letter-spacing: -0.5px; font-size: clamp(34px, 4.5vw, 64px); margin-top: 16px; }
        .lp .price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
        .lp .price-card { border: 1.5px solid rgba(255,255,255,0.2); border-radius: 18px; padding: 44px; transition: all 0.3s; position: relative; }
        .lp .price-card.featured { background: ${BLUE}; border-color: ${BLUE}; }
        .lp .price-card.featured::before {
          content: "POPULAR"; position: absolute; top: 24px; right: 24px;
          font-family: 'Archivo', sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 1.5px;
          background: ${YELLOW}; color: ${INK}; padding: 5px 12px; border-radius: 100px;
        }
        .lp .price-card .size-img {
          aspect-ratio: 4/3; border-radius: 12px; margin-bottom: 26px;
          background: repeating-linear-gradient(45deg, transparent, transparent 14px, rgba(255,255,255,0.05) 14px, rgba(255,255,255,0.05) 15px);
          border: 1px solid rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center;
        }
        .lp .price-card .size-img .ph { font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 12px; letter-spacing: 0.5px; opacity: 0.55; text-align: center; line-height: 1.7; }
        .lp .price-card .plan { font-family: 'Archivo', sans-serif; font-size: 14px; font-weight: 800; letter-spacing: 2px; opacity: 0.7; }
        .lp .price-card .price { font-family: 'Gothic A1', sans-serif; font-weight: 900; letter-spacing: -1px; font-size: 52px; margin: 18px 0 6px; }
        .lp .price-card .price small { font-size: 18px; font-weight: 500; opacity: 0.7; }
        .lp .price-card .desc { font-size: 14px; opacity: 0.7; margin-bottom: 28px; font-weight: 500; }
        .lp .price-card ul { list-style: none; }
        .lp .price-card li { font-size: 15px; font-weight: 500; padding: 11px 0; border-top: 1px solid rgba(255,255,255,0.13); display: flex; align-items: center; gap: 10px; }
        .lp .price-card li::before { content: "✓"; color: ${YELLOW}; font-weight: 800; }

        /* FINAL */
        .lp .final { background: ${YELLOW}; padding: 130px 48px; text-align: center; position: relative; overflow: hidden; }
        .lp .final h2 { font-family: 'Gothic A1', sans-serif; font-weight: 900; font-size: clamp(38px, 6vw, 96px); color: ${BLUE_DEEP}; line-height: 1.1; letter-spacing: -1px; margin-bottom: 40px; }
        .lp .final .btn-primary { background: ${BLUE_DEEP}; box-shadow: 0 10px 30px rgba(15,31,143,0.3); font-size: 19px; padding: 22px 56px; }

        /* FOOTER */
        .lp footer { background: ${INK}; color: #fff; padding: 36px 48px; }
        .lp .footer-top { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.12); }
        .lp .footer-top .logo { font-family: 'Archivo', sans-serif; font-weight: 900; font-size: 22px; display: flex; align-items: center; gap: 9px; }
        .lp .footer-top .logo .box { width: 15px; height: 15px; border: 2.5px solid #fff; }
        .lp .footer-links { display: flex; align-items: center; gap: 12px; }
        .lp .footer-links a { color: rgba(255,255,255,0.7); text-decoration: none; font-size: 13px; }
        .lp .footer-links a:hover { color: ${YELLOW}; }
        .lp .footer-links span { color: rgba(255,255,255,0.25); }
        .lp .footer-meta { max-width: 1200px; margin: 18px auto 0; display: flex; flex-wrap: wrap; gap: 8px 18px; }
        .lp .footer-meta span { font-size: 12px; color: rgba(255,255,255,0.45); position: relative; }
        .lp .footer-meta span:not(:last-child)::after { content: "·"; position: absolute; right: -11px; color: rgba(255,255,255,0.25); }
        .lp .footer-copy { max-width: 1200px; margin: 16px auto 0; font-size: 11.5px; color: rgba(255,255,255,0.3); }

        /* MODAL */
        .lp-modal-overlay {
          position: fixed; inset: 0; background: rgba(10,10,10,0.55); backdrop-filter: blur(6px);
          z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 24px;
          opacity: 0; transition: opacity 0.3s;
        }
        .lp-modal-overlay.open { opacity: 1; }
        .lp-modal-box {
          width: 100%; max-width: 440px; height: 88vh; max-height: 860px; background: #fff;
          border-radius: 28px; overflow: hidden; position: relative; box-shadow: 0 30px 80px rgba(0,0,0,0.4);
          transform: translateY(30px) scale(0.97); transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
          display: flex; flex-direction: column;
        }
        .lp-modal-overlay.open .lp-modal-box { transform: translateY(0) scale(1); }
        .lp-modal-head { padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #eee; flex-shrink: 0; }
        .lp-modal-head .title { font-weight: 800; font-size: 15px; color: ${INK}; font-family: 'Gothic A1', sans-serif; }
        .lp-modal-head .close { width: 32px; height: 32px; border: none; background: #f3f3f1; border-radius: 50%; cursor: pointer; font-size: 18px; color: #555; display: flex; align-items: center; justify-content: center; transition: background 0.2s; }
        .lp-modal-head .close:hover { background: #e5e5e2; }
        .lp-modal-body { flex: 1; overflow: hidden; }
        .lp-modal-body iframe { width: 100%; height: 100%; border: none; }

        @media (max-width: 880px) {
          .lp nav { padding: 18px 24px; }
          .lp .howto-grid { grid-template-columns: 1fr; }
          .lp .howto { padding: 90px 24px; }
          .lp .module-grid { grid-template-columns: 1fr; }
          .lp .gallery-grid { grid-template-columns: 1fr; }
          .lp .price-grid { grid-template-columns: 1fr; }
          .lp .module, .lp .gallery, .lp .pricing, .lp .final { padding: 90px 24px; }
        }

        @keyframes lpRevealUp { to { transform: translateY(0); } }
        @keyframes lpFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lpMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }

        .lp .reveal { opacity: 0; transform: translateY(40px); transition: opacity 0.8s ease, transform 0.8s cubic-bezier(0.16,1,0.3,1); }
        .lp .reveal.in { opacity: 1; transform: translateY(0); }
      `}</style>

      <div className="lp">
        {/* NAV */}
        <nav>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>씬박스 문의</span>
            <a href="tel:07080576783" style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: "0.5px", whiteSpace: "nowrap", textDecoration: "none" }}>070-8057-6783</a>
          </div>
          <button className="nav-cta" onClick={openModal}>예약하기</button>
        </nav>

        {/* HERO */}
        <header className="hero">
          <div className="hero-nav">
            <button onClick={() => document.getElementById("module")?.scrollIntoView({ behavior: "smooth" })}>THE SYSTEM</button>
            <button onClick={() => document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" })}>REAL CASES</button>
            <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>PRICING</button>
          </div>
          <img className="hero-img" src="/images/hero.png" alt="공간에 맞추지 말고 짐에 맞춰 보관하세요 - SCENE BOX" />
          <p className="hero-sub">촬영 소품, 무대 설치물, 팝업 집기, 비정형 화물까지.<br />씬박스는 당신의 짐에 공간을 맞춥니다.</p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={openModal}>보관 예약하기</button>
          </div>
          <div className="hero-strip">
            <div className="marquee">
              <span>SCENEBOX</span><span>비정형 짐 전문 보관</span><span>1.1m MODULE PALLET</span><span>촬영·무대·팝업</span><span>SCENEBOX</span><span>비정형 짐 전문 보관</span><span>1.1m MODULE PALLET</span><span>촬영·무대·팝업</span>
            </div>
          </div>
        </header>

        {/* HOW IT WORKS */}
        <section className="howto" id="howto">
          <div className="howto-inner">
            <div className="head reveal">
              <div className="section-label mono">HOW IT WORKS</div>
              <h2>어떻게 이용하고 싶으세요?</h2>
              <p className="howto-lead">두 가지 방법 중 편한 쪽을 선택하세요.</p>
            </div>
            <div className="howto-grid">

              <div className="howto-card howto-a reveal">
                <div className="howto-tag">공간을 직접 빌려요</div>
                <h3>공간을 직접 빌려<br />자유롭게 쓰고 싶다면</h3>
                <p className="howto-desc">전용 공간을 확보해 <strong>우리 회사 창고처럼.</strong> 필요할 때마다 자유롭게 짐을 넣고 빼세요.</p>
                <div className="howto-flow">
                  <span>로그인</span><i>→</i><span>최초 1회 정보 등록</span><i>→</i><span>공간·차량·폐기 신청</span><i>→</i><span>기간·결제</span>
                </div>
                <p className="howto-note">법인·개인카드, 사업자지출증빙, 세금계산서 결제 가능</p>
                <button className="howto-btn howto-btn-a" onClick={openModal}>보관 예약하기 →</button>
              </div>

              <div className="howto-card howto-b reveal">
                <div className="howto-tag">먼저 상담받아요</div>
                <h3>짐 크기가<br />가늠 안 된다면</h3>
                <p className="howto-desc">비정형·대형·일회성 화물, <strong>얼마나 들어갈지 모를 때.</strong> 전화 주시면 맞춰서 안내해 드립니다.</p>
                <div className="howto-flow">
                  <span>전화 상담</span><i>→</i><span>견적 확인</span><i>→</i><span>결제</span>
                </div>
                <p className="howto-note">짐 종류·크기에 맞춰 1:1로 상담해 드려요<br />법인·개인카드, 사업자지출증빙, 세금계산서 결제 가능</p>
                <a className="howto-btn howto-btn-b" href="tel:07080576783">전화 상담하기 070-8057-6783</a>
              </div>

            </div>
          </div>
        </section>

        {/* MODULE */}
        <section className="module" id="module">
          <div className="module-inner">
            <div className="section-label mono reveal">THE SYSTEM</div>
            <h2 className="reveal">원하는 만큼,<br />원하는 크기로.<br /><span className="yellow">배차부터 보관까지,<br />원스톱으로.</span></h2>
            <div className="module-grid">
              <div className="mod-card reveal">
                <div className="num mono">01</div>
                <h3>규격화된 전용 Grid</h3>
                <p>박스 적재부터 대형 세트장·비정형 화물까지 모두 수납 가능. 공간 효율을 극대화합니다.</p>
              </div>
              <div className="mod-card reveal">
                <div className="num mono">02</div>
                <h3>전용 차량으로 원스톱 배차</h3>
                <p>입고부터 납품까지, 전화 한 통으로 해결.<br />비정형 대형 화물 운송도 맡겨주세요.</p>
              </div>
              <div className="mod-card reveal">
                <div className="num mono">03</div>
                <h3>저울로 재는 투명한 폐기 정산</h3>
                <p>kg당 정량 계근으로 정산합니다.<br />눈먼 폐기 비용 없이 깔끔하게 처리합니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* GALLERY */}
        <section className="gallery" id="gallery">
          <div className="gallery-inner">
            <div className="head reveal">
              <div className="section-label mono">REAL CASES</div>
              <h2>이런 짐도 보관합니다</h2>
            </div>
            <div className="gallery-grid">
            <div className="gal-item reveal" onClick={() => setLightbox("/images/gallery-1.png")}>
                <img className="gal-img" src="/images/gallery-1.png" alt="촬영 소품 세트" />
                <div className="cap"><div className="t">촬영 소품 세트</div><div className="d">빈티지 트렁크 · 오브제 보관</div></div>
              </div>
              <div className="gal-item reveal" onClick={() => setLightbox("/images/gallery-2.png")}>
                <img className="gal-img" src="/images/gallery-2.png" alt="대형 무대 설치물" />
                <div className="cap"><div className="t">대형 무대 설치물</div><div className="d">에어바운스 놀이시설 · 높이 5m</div></div>
              </div>
              <div className="gal-item reveal" onClick={() => setLightbox("/images/gallery-3.png")}>
                <img className="gal-img" src="/images/gallery-3.png" alt="웨딩 행사 세트" />
                <div className="cap"><div className="t">웨딩 · 행사 세트</div><div className="d">플라워 아치 · 높이 3m</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="pricing" id="pricing">
          <div className="pricing-inner">
            <div className="head reveal">
              <div className="section-label mono">PRICING</div>
              <h2>짐에 맞는 요금</h2>
            </div>
            <div className="price-grid">
            <div className="price-card reveal">
            <div className="size-img" style={{ cursor: "zoom-in" }} onClick={() => setLightbox("/images/pricing-1.jpg")}><img className="size-pic" src="/images/pricing-1.jpg" alt="파레트 1개 사이즈 비교" /></div>
                <div className="plan mono">PALLET</div>
                <div className="price">50,000<small>원/월</small></div>
                <div className="desc">표준 파레트 1개 · VAT 별도</div>
                <ul>
                  <li>1.1m × 1.1m 파레트 1개</li>
                  <li>최대 적재 높이 2m</li>
                  <li>소량 보관에 적합</li>
                </ul>
              </div>
              <div className="price-card featured reveal">
              <div className="size-img" style={{ cursor: "zoom-in" }} onClick={() => setLightbox("/images/pricing-2.jpg")}><img className="size-pic" src="/images/pricing-2.jpg" alt="1그리드 사이즈 비교" /></div>
                <div className="plan mono">1 GRID</div>
                <div className="price">120,000<small>원/월</small></div>
                <div className="desc">파레트 3개 (1.2평) · VAT 별도</div>
                <ul>
                  <li>1.1m × 1.1m 파레트 3개</li>
                  <li>대형 · 비정형 화물 가능</li>
                  <li>무대 설치물 · 팝업 집기에 최적</li>
                </ul>
              </div>
            </div>

            <div className="reveal" style={{ marginTop: 32, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "24px 28px", maxWidth: 1000, marginLeft: "auto", marginRight: "auto" }}>
              <p style={{ fontFamily: "'Archivo',sans-serif", fontSize: 12, fontWeight: 800, letterSpacing: 2, color: YELLOW, marginBottom: 14 }}>STORAGE GUIDE</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                <p style={{ fontSize: 15, fontWeight: 500, color: "rgba(255,255,255,0.85)", lineHeight: 1.7 }}>
                  <span style={{ color: YELLOW, fontWeight: 800, marginRight: 8 }}>·</span>
                  이삿짐 등 <strong style={{ color: "#fff", fontWeight: 800 }}>개인 단기 화물은 별도 문의</strong> 바랍니다. (070-8057-6783)
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="final">
          <h2>이제, 짐에<br />공간을 맞추세요.</h2>
          <button className="btn-primary" onClick={openModal}>보관 예약하기</button>
        </section>

        {/* FOOTER */}
        <footer>
          <div className="footer-top">
            <div className="logo">SCENE<span className="box"></span>BOX</div>
            <div className="footer-links">
            <a href="/terms">이용약관</a>
              <span>|</span>
              <a href="/privacy" style={{ fontWeight: 800, color: "#fff", textDecoration: "underline" }}>개인정보처리방침</a>
              <span>|</span>
              <a href="/refund">취소 및 환불 규정</a>
            </div>
          </div>
          <div className="footer-meta">
            <span>씬박스(SceneBox) · 대표 박민지</span>
            <span>사업자등록번호 806-36-01589</span>
            <span>통신판매업 2026-용인처인-01107</span>
            <span>경기도 용인시 처인구 모현읍 곡현로 734</span>
            <span>070-8057-6783 / 010-2897-8524</span>
            <span>easy.keep.kr@gmail.com</span>
          </div>
          <div className="footer-copy">© 2026 씬박스(SceneBox). 비정형 짐 전문 보관 서비스. All rights reserved. &nbsp;|&nbsp; scenebox.co.kr &nbsp;|&nbsp; @scenebox_official</div>
        </footer>
        </div>

        {showPromo && (
  <div
    onClick={() => setShowPromo(false)}
    style={{
      position: "fixed", inset: 0, zIndex: 3000,
      background: "rgba(10,10,10,0.6)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        width: "100%", maxWidth: 380, background: "#fff",
        borderRadius: 24, overflow: "hidden",
        boxShadow: "0 30px 80px rgba(0,0,0,0.4)",
        fontFamily: "'Gothic A1','Apple SD Gothic Neo',sans-serif",
        position: "relative",
      }}
    >
      {/* 상단 노란 헤더 */}
      <div style={{ background: "#FFD400", padding: "28px 24px 22px", textAlign: "center", position: "relative" }}>
        <button
          onClick={() => setShowPromo(false)}
          style={{
            position: "absolute", top: 16, right: 16, width: 30, height: 30,
            borderRadius: "50%", border: "none", background: "rgba(10,10,10,0.1)",
            color: "#0A0A0A", fontSize: 18, cursor: "pointer", lineHeight: 1,
          }}
        >×</button>
        <div style={{ fontFamily: "'Archivo',sans-serif", fontSize: 12, fontWeight: 800, letterSpacing: 2, color: "#1A36E8", marginBottom: 8 }}>
          PRE-LAUNCH EVENT
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 900, color: "#0A0A0A", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
          프리런칭 기념<br />이벤트 🎉
        </h2>
      </div>

      {/* 이벤트 내용 */}
      <div style={{ padding: "24px 24px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 900, color: "#1A36E8" }}>1</div>
          <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#0A0A0A", marginBottom: 3 }}>1개월 무료 증정</p>
            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
              결제 후 <strong style={{ color: "#1A36E8" }}>1개월 자동 연장</strong>으로<br />한 달을 무료로 더 이용하세요.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 900, color: "#10B981" }}>2</div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "#0A0A0A", marginBottom: 3 }}>이행보증금 면제</p>
            <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
              <strong style={{ color: "#10B981" }}>2개월치 이행보증금</strong>을<br />런칭 기념으로 전액 면제해 드립니다.
            </p>
          </div>
        </div>
      </div>

      {/* CTA 버튼 */}
      <div style={{ padding: "0 24px 16px" }}>
        <button
          onClick={openModal}
          style={{
            width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
            background: "#1A36E8", color: "#fff", fontSize: 15, fontWeight: 800,
            cursor: "pointer", boxShadow: "0 6px 20px rgba(26,54,232,0.35)",
          }}
        >
          지금 예약하고 혜택 받기
        </button>
      </div>

      {/* 하단 닫기 옵션 */}
      <div style={{ borderTop: "1px solid #F0F0F0", display: "flex" }}>
        <button
          onClick={closePromoToday}
          style={{ flex: 1, padding: "14px 0", border: "none", background: "transparent", color: "#94A3B8", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          오늘 하루 보지 않기
        </button>
        <div style={{ width: 1, background: "#F0F0F0" }} />
        <button
          onClick={() => setShowPromo(false)}
          style={{ flex: 1, padding: "14px 0", border: "none", background: "transparent", color: "#64748B", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          닫기
        </button>
      </div>
    </div>
  </div>
)}

{/* 카카오톡 플로팅 버튼 */}

href="http://pf.kakao.com/_ngBCX/chat"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    position: "fixed",
    bottom: 24,
    right: 24,
    zIndex: 1500,
    background: "#FEE500",
    borderRadius: 100,
    padding: "14px 20px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
    fontFamily: "'Gothic A1','Apple SD Gothic Neo',sans-serif",
  }}
>
  <span style={{ fontSize: 18 }}>💬</span>
  <span style={{ fontSize: 14, fontWeight: 800, color: "#191600", whiteSpace: "nowrap" }}>카카오톡 문의</span>
</a>

{lightbox && (
  <div
    onClick={() => setLightbox(null)}
    style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "rgba(10,10,10,0.9)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px", cursor: "zoom-out",
    }}
  >
    <img
      src={lightbox}
      alt="확대 이미지"
      style={{ maxWidth: "92%", maxHeight: "92%", borderRadius: "12px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
    />
    <button
      onClick={() => setLightbox(null)}
      style={{
        position: "fixed", top: "24px", right: "24px",
        width: "44px", height: "44px", borderRadius: "50%",
        border: "none", background: "rgba(255,255,255,0.15)", color: "#fff",
        fontSize: "24px", cursor: "pointer",
      }}
    >×</button>
  </div>
)}

</>
);
}
