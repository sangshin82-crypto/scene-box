'use client';

import { useState, useEffect } from "react";

const BLUE = "#1A36E8";
const BLUE_DEEP = "#0F1F8F";
const YELLOW = "#FFD400";
const BEIGE = "#F5F4EF";
const INK = "#0A0A0A";
const GRAY = "#8A8A85";

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);

  const openModal = () => {
    setModalOpen(true);
    document.body.style.overflow = "hidden";
  };
  const closeModal = () => {
    setModalOpen(false);
    document.body.style.overflow = "";
  };

  // ESC로 모달 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
          justify-content: flex-end; align-items: center; position: relative;
          padding: 0 24px 130px; overflow: hidden;
          background:
            repeating-linear-gradient(45deg, transparent, transparent 22px, rgba(10,10,10,0.025) 22px, rgba(10,10,10,0.025) 23px),
            ${BEIGE};
          background-size: cover; background-position: center;
          /* 실제 적용 시: background: url('/images/hero-kv.png') center/cover; */
        }
        .lp .hero::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(245,244,239,0.92) 0%, rgba(245,244,239,0.4) 35%, transparent 60%);
          pointer-events: none; z-index: 1;
        }
        .lp .hero-kv-label {
          position: absolute; top: 45%; left: 50%; transform: translate(-50%, -50%);
          font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 14px;
          letter-spacing: 1px; color: ${GRAY}; text-align: center; line-height: 1.9;
          z-index: 1; opacity: 0.6;
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
          <div className="logo">SCENE<span className="box"></span>BOX</div>
          <button className="nav-cta" onClick={openModal}>예약하기</button>
        </nav>

        {/* HERO */}
        <header className="hero">
          <div className="hero-kv-label">[ 풀스크린 키비주얼<br />여기에 배경으로 들어갑니다<br />3840 × 2160px / cover ]</div>
          <div className="hero-tag mono">STORAGE FOR THE SCENE</div>
          <h1>
            <span className="line"><span>공간에 맞추지 말고</span></span>
            <span className="line"><span className="blue">짐에 맞춰 보관하세요</span></span>
          </h1>
          <p className="hero-sub">촬영 소품, 무대 설치물, 팝업 집기, 비정형 대형 화물까지.<br />씬박스는 당신의 짐에 공간을 맞춥니다.</p>
          <div className="hero-cta">
            <button className="btn-primary" onClick={openModal}>보관 예약하기</button>
          </div>
          <div className="hero-strip">
            <div className="marquee">
              <span>SCENEBOX</span><span>비정형 짐 전문 보관</span><span>1.1m MODULE PALLET</span><span>촬영·무대·팝업</span><span>SCENEBOX</span><span>비정형 짐 전문 보관</span><span>1.1m MODULE PALLET</span><span>촬영·무대·팝업</span>
            </div>
          </div>
        </header>

        {/* MODULE */}
        <section className="module" id="module">
          <div className="module-inner">
            <div className="section-label mono reveal">THE SYSTEM</div>
            <h2 className="reveal">원하는 만큼,<br /><span className="yellow">원하는 크기로.</span></h2>
            <div className="module-grid">
              <div className="mod-card reveal">
                <div className="num mono">01</div>
                <h3>1.1m 모듈 파레트</h3>
                <p>1.1m × 1.1m 표준 파레트 단위로 짐을 적재합니다. 짐의 양에 딱 맞는 공간만 사용하세요.</p>
              </div>
              <div className="mod-card reveal">
                <div className="num mono">02</div>
                <h3>어떤 사이즈도 가능</h3>
                <p>촬영 소품부터 5m 대형 무대 설치물까지. 높이와 형태에 제약 없이 보관합니다.</p>
              </div>
              <div className="mod-card reveal">
                <div className="num mono">03</div>
                <h3>투명한 정산</h3>
                <p>보관료·운송료·폐기비를 저울 단위로 정량 계근. 눈먼 비용 없이 깔끔하게 정산합니다.</p>
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
              <div className="gal-item reveal">
                <div className="ph">[ 빈티지 트렁크 · 소품 ]</div>
                <div className="cap"><div className="t">촬영 소품 세트</div><div className="d">빈티지 트렁크 · 오브제 보관</div></div>
              </div>
              <div className="gal-item reveal">
                <div className="ph">[ 에어바운스 · 5m ]</div>
                <div className="cap"><div className="t">대형 무대 설치물</div><div className="d">에어바운스 놀이시설 · 높이 5m</div></div>
              </div>
              <div className="gal-item reveal">
                <div className="ph">[ 웨딩 플라워 아치 ]</div>
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
                <div className="size-img"><div className="ph">[ 파레트 1개<br />사이즈 비교 이미지 ]</div></div>
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
                <div className="size-img"><div className="ph">[ 1그리드(파레트 3개)<br />사이즈 비교 이미지 ]</div></div>
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
              <a href="/privacy">개인정보처리방침</a>
              <span>|</span>
              <a href="/refund" style={{ fontWeight: 700 }}>취소 및 환불 규정</a>
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

      {/* MODAL */}
      {modalOpen && (
        <div
          className="lp-modal-overlay open"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="lp-modal-box">
            <div className="lp-modal-head">
              <div className="title">씬박스 보관 예약</div>
              <button className="close" onClick={closeModal}>×</button>
            </div>
            <div className="lp-modal-body">
              <iframe src="/" title="씬박스 예약" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
