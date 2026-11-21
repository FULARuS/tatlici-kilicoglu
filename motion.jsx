import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Magnet from './vendor/react-bits/Magnet.jsx';

gsap.registerPlugin(ScrollTrigger);

const stage = document.querySelector('[data-baklava-stage]');
const control = document.querySelector('[data-motion-control]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function createPastryTimeline() {
  const whole = stage.querySelector('.baklava-whole');
  const saucer = stage.querySelector('.baklava-saucer');
  const shadow = stage.querySelector('.baklava-shadow');
  const crust = stage.querySelector('.baklava-crust');
  const filling = stage.querySelector('.baklava-filling');
  const base = stage.querySelector('.baklava-base');
  const labels = stage.querySelector('.layer-labels');

  return gsap.timeline({
    paused: true, repeat: -1, yoyo: true, repeatDelay: 1.12, defaults: { ease: 'sine.inOut' }
  })
    .to(shadow, { scaleX: 0.93, opacity: 0.55, duration: 1.57 }, 0.23)
    .to(whole, { opacity: 0, yPercent: -1.2, duration: 0.45 }, 0.21)
    .to(saucer, { opacity: 1, duration: 0.45 }, 0.21)
    .to([crust, filling, base], { opacity: 1, duration: 0.4 }, 0.23)
    .to(crust, {
      duration: 1.56,
      keyframes: {
        yPercent: [0, -1.7, -4.4, -7.4, -10.2, -12],
        rotation: [0, -0.22, -0.7, -1.4, -2.3, -3],
        ease: 'sine.inOut', easeEach: 'none'
      }
    }, 0.26)
    .to(filling, {
      duration: 1.47,
      keyframes: {
        yPercent: [0, -0.3, -1.2, -2.3, -3.4, -4],
        xPercent: [0, 0.12, 0.36, 0.75, 1.15, 1.5],
        ease: 'sine.inOut', easeEach: 'none'
      }
    }, 0.36)
    .to(base, {
      duration: 1.37,
      keyframes: {
        yPercent: [0, -0.22, -0.8, -1.6, -2.45, -3],
        rotation: [0, 0.15, 0.42, 0.95, 1.55, 2],
        ease: 'sine.inOut', easeEach: 'none'
      }
    }, 0.49)
    .to(labels, { opacity: 1, x: 0, duration: 0.52, ease: 'power2.out' }, 0.99);
}

function PastryControl() {
  const [paused, setPaused] = useState(false);
  const [stillOpen, setStillOpen] = useState(false);
  const [reduce, setReduce] = useState(reducedMotion.matches);
  const manualToggle = useRef(null);

  useEffect(() => {
    const timeline = createPastryTimeline();
    const labels = stage.querySelector('.layer-labels');
    let inView = false;
    let pausedByUser = false;
    let showingStill = false;

    function syncPlayback() {
      timeline.paused(!inView || pausedByUser || document.hidden || reducedMotion.matches);
    }

    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.intersectionRatio >= 0.15;
      syncPlayback();
    }, { threshold: 0.15 });
    observer.observe(stage);
    document.addEventListener('visibilitychange', syncPlayback);

    manualToggle.current = () => {
      if (reducedMotion.matches) {
        showingStill = !showingStill;
        setStillOpen(showingStill);
        labels.setAttribute('aria-hidden', String(!showingStill));
        timeline.totalTime(showingStill ? timeline.duration() : 0).pause();
        return;
      }

      pausedByUser = !pausedByUser;
      setPaused(pausedByUser);
      syncPlayback();
    };

    function updateMotionPreference(event) {
      setReduce(event.matches);
      showingStill = false;
      setStillOpen(false);
      labels.setAttribute('aria-hidden', 'true');
      timeline.pause(0);
      syncPlayback();
    }

    reducedMotion.addEventListener('change', updateMotionPreference);

    return () => {
      reducedMotion.removeEventListener('change', updateMotionPreference);
      document.removeEventListener('visibilitychange', syncPlayback);
      observer.disconnect();
      timeline.revert();
    };
  }, []);

  return (
    <Magnet disabled={reduce} padding={28} magnetStrength={5} maxOffset={10} wrapperClassName="motion-magnet">
      <button
        className="button button-line motion-toggle"
        type="button"
        aria-controls="baklava-stage"
        aria-expanded={reduce ? stillOpen : undefined}
        aria-label={reduce ? undefined : paused ? 'Baklava animasyonunu sürdür' : 'Baklava animasyonunu duraklat'}
        onClick={() => manualToggle.current?.()}
      >
        {reduce ? (stillOpen ? 'Baklavayı birleştir' : 'Katmanları gör') : (paused ? 'Sürdür' : 'Duraklat')}
      </button>
    </Magnet>
  );
}

const responsiveMotion = gsap.matchMedia();

responsiveMotion.add('(prefers-reduced-motion: no-preference)', () => {
  const lenis = new Lenis({ lerp: 0.11, stopInertiaOnNavigate: true });
  const animateScroll = (time) => lenis.raf(time * 1000);

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(animateScroll);

  for (const section of document.querySelectorAll('[data-reveal]')) {
    gsap.from(section, {
      opacity: 0.52,
      y: 21,
      duration: 0.75,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 92%', once: true }
    });
  }

  return () => {
    gsap.ticker.remove(animateScroll);
    lenis.destroy();
  };
});

const products = [...document.querySelectorAll('[data-kind]')];
const filters = document.querySelector('[data-filters]');
const filterButtons = [...filters.querySelectorAll('[data-filter]')];
const catalogStatus = document.querySelector('[data-catalog-status]');

filters.hidden = false;
filters.addEventListener('click', (event) => {
  const selected = event.target.closest('[data-filter]');
  if (!selected || selected.getAttribute('aria-pressed') === 'true') return;

  for (const button of filterButtons) {
    button.setAttribute('aria-pressed', String(button === selected));
  }

  const kind = selected.dataset.filter;
  const visible = products.filter((product) => kind === 'all' || product.dataset.kind === kind);

  gsap.killTweensOf(products);
  gsap.set(products, { clearProps: 'opacity,transform' });
  for (const product of products) product.hidden = !visible.includes(product);

  catalogStatus.textContent = `${visible.length} tatlı gösteriliyor.`;
  ScrollTrigger.refresh();
  if (!reducedMotion.matches) {
    gsap.fromTo(visible, { opacity: 0.5, y: 12 }, {
      opacity: 1, y: 0, duration: 0.42, stagger: 0.045, ease: 'power2.out', clearProps: 'opacity,transform'
    });
  }
});

const dialog = document.querySelector('[data-product-dialog]');
if (typeof dialog.showModal === 'function') {
  const picture = dialog.querySelector('[data-dialog-image]');
  const title = dialog.querySelector('h2');
  const description = dialog.querySelector('[data-dialog-description]');
  for (const product of products) {
    const button = product.querySelector('[data-product-open]');
    button.hidden = false;
    button.addEventListener('click', () => {
      const image = product.querySelector('img');
      picture.src = image.getAttribute('src');
      picture.alt = image.alt;
      picture.classList.toggle('dialog-plated', product.querySelector('.product-image-hero') !== null);
      title.textContent = product.querySelector('h3').textContent;
      description.textContent = product.dataset.productNote;
      dialog.showModal();
      if (!reducedMotion.matches) {
        gsap.fromTo(dialog, { opacity: 0, y: 18 }, {
          opacity: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'opacity,transform'
        });
      }
    });
  }
  dialog.querySelector('[data-dialog-route]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

Promise.all([...stage.querySelectorAll('img')].map((image) => image.decode()))
  .then(() => {
    control.hidden = false;
    createRoot(control).render(<PastryControl />);
  })
  .catch(() => {
    // Keep the plated image visible if an animation asset fails to load.
  });
