/* ==========================================================================
   AETHER TECH PREMIUM — CATEGORY-AWARE TEMPLATE REGISTRY JAVASCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Global Footer Year
  const yearEl = document.getElementById('hud-current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Retrieve active portfolio type category
  const portfolioType = document.body.getAttribute('data-type') || 'Developer';

  /* ==========================================================================
     GLOBAL HELPER FUNCTIONS
     ========================================================================== */
  
  // 1. Dynamic Technologies Parser
  const parseTechnologies = () => {
    // Select all tech containers across themes
    const containers = document.querySelectorAll(
      '.pod-tags, .designer-gallery-tags, .fl-project-tags, .student-project-tags, .business-case-tag'
    );
    
    containers.forEach(container => {
      const rawTech = container.getAttribute('data-technologies');
      if (rawTech && rawTech.trim().length > 0) {
        const list = rawTech.split(',').map(t => t.trim()).filter(t => t.length > 0);
        container.innerHTML = ''; // clear placeholder
        
        list.forEach(tech => {
          const span = document.createElement('span');
          span.className = 'pod-tech-badge';
          // designer and business tags have minimal prefix formatting
          if (container.classList.contains('designer-gallery-tags')) {
            span.textContent = `#${tech} `;
            span.style.color = '#d4af37';
          } else {
            span.textContent = tech;
          }
          container.appendChild(span);
        });
      } else {
        // Safe fallback
        container.innerHTML = '';
      }
    });
  };

  // 2. Empty Sections Stripper
  const pruneEmptySections = () => {
    // Check if certificates are empty for the active category
    const activeCertContainer = document.querySelector(`.${portfolioType.toLowerCase()}-only [id*="credentials-"]`);
    const devCertContainer = document.getElementById('credentials-wrapper');
    const certTarget = activeCertContainer || devCertContainer;
    
    if (certTarget) {
      const childCount = certTarget.children.length;
      if (childCount === 0) {
        const certSection = document.getElementById('credentials');
        if (certSection) {
          certSection.style.display = 'none';
          // also hide nav deck link if present
          const certNav = document.querySelector(`.deck-item[href="#credentials"]`);
          if (certNav) certNav.style.display = 'none';
        }
      }
    }

    // Check if timelines are empty
    const expId = `experience-${portfolioType.toLowerCase()}-list`;
    const eduId = `education-${portfolioType.toLowerCase()}-list`;
    
    const expContainer = document.getElementById(expId) || document.getElementById('experience-rack-list');
    const eduContainer = document.getElementById(eduId) || document.getElementById('education-rack-list');
    
    const hasExp = expContainer && expContainer.children.length > 0;
    const hasEdu = eduContainer && eduContainer.children.length > 0;

    if (!hasExp && !hasEdu) {
      const timelineSection = document.getElementById('timeline-flow');
      if (timelineSection) {
        timelineSection.style.display = 'none';
        const timelineNav = document.querySelector(`.deck-item[href="#timeline-flow"]`);
        if (timelineNav) timelineNav.style.display = 'none';
      }
    } else {
      // If one is empty, hide its column wrapper
      if (!hasExp && expContainer) expContainer.closest('.timeline-hud-column, .designer-time-col, .freelance-time-col, .student-academic-timeline-col, .business-exec-col').style.display = 'none';
      if (!hasEdu && eduContainer) eduContainer.closest('.timeline-hud-column, .designer-time-col, .freelance-time-col, .student-academic-timeline-col, .business-exec-col').style.display = 'none';
    }
  };

  // 3. Navigation Intersection Scroll Highlight Handler
  const initNavScrollTracker = () => {
    const sectionsList = document.querySelectorAll('section');
    
    // Select relevant navigation items based on active category theme
    let navQuery = '';
    if (portfolioType === 'Developer') navQuery = '.deck-item';
    else if (portfolioType === 'Designer') navQuery = '.designer-nav-item';
    else if (portfolioType === 'Freelancer') navQuery = '.capsule-link';
    else if (portfolioType === 'Student') navQuery = '.student-link, .student-link-btn';
    else if (portfolioType === 'Business') navQuery = '.business-menu-item, .business-cta-button';

    const activeNavLinks = document.querySelectorAll(navQuery);
    if (activeNavLinks.length === 0) return;

    const onScroll = () => {
      let scrollPos = window.scrollY + window.innerHeight / 2.8;

      sectionsList.forEach(sec => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');
        
        if (scrollPos >= top && scrollPos < top + height) {
          activeNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Initial run

    // Smooth Anchor Scroll handler
    activeNavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          e.preventDefault();
          const targetSec = document.querySelector(targetId);
          if (targetSec) {
            targetSec.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      });
    });
  };

  /* ==========================================================================
     CATEGORY RENDERER CLASS DEFINITIONS (TEMPLATE REGISTRY PATTERN)
     ========================================================================== */

  // A. Developer Theme Renderer
  class DeveloperRenderer {
    render() {
      // 1. Loader timer
      const loader = document.getElementById('cyber-boot-loader');
      if (loader) {
        setTimeout(() => {
          loader.classList.add('hidden');
        }, 1600);
      }

      // 2. Latency Monitor simulator
      const latencyVal = document.getElementById('latency-val');
      if (latencyVal) {
        setInterval(() => {
          const ping = Math.floor(Math.random() * 21) + 8; // 8ms - 28ms
          latencyVal.textContent = `${ping}ms`;
        }, 4000);
      }

      // 3. Transmission CLI console logger
      const transmissionForm = document.getElementById('cyber-transmission-form');
      const feedConsole = document.getElementById('feed-console-logs');

      if (transmissionForm && feedConsole) {
        const appendFeedLine = (text, type = 'normal') => {
          const line = document.createElement('p');
          line.className = 'feed-line';
          if (type === 'error') line.style.color = '#ef4444';
          if (type === 'success') line.style.color = '#00ff66';
          if (type === 'warning') line.style.color = '#eab308';
          
          const timestamp = new Date().toLocaleTimeString();
          line.textContent = `[${timestamp}] ${text}`;
          feedConsole.appendChild(line);
          feedConsole.scrollTop = feedConsole.scrollHeight;
        };

        transmissionForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const name = document.getElementById('sig-name').value;
          const email = document.getElementById('sig-email').value;
          const msg = document.getElementById('sig-message').value;

          appendFeedLine(`[PAYLOAD_INIT] Connecting secure transmission nodes for ${name}...`, 'warning');
          
          setTimeout(() => {
            appendFeedLine(`[ENCRYPTING] Executing handshake SSL with frequency ${email}...`);
          }, 850);

          setTimeout(() => {
            appendFeedLine(`[DISPATCHING] Dispatched data package of size ${msg.length} bytes.`);
          }, 1700);

          setTimeout(() => {
            appendFeedLine(`[SUCCESS] Signal dispatched successfully! Transaction ID: ${Math.random().toString(36).substring(7).toUpperCase()}`, 'success');
            transmissionForm.reset();
            alert('Decryption payload accepted. Signal transmitted.');
          }, 2600);
        });
      }
    }
  }

  // B. Designer Theme Renderer
  class DesignerRenderer {
    render() {
      // Designers have direct subtle page transitions
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 1s ease';
      window.addEventListener('load', () => {
        document.body.style.opacity = '1';
      });
      // Fallback
      setTimeout(() => {
        document.body.style.opacity = '1';
      }, 500);
    }
  }

  // C. Freelancer Theme Renderer
  class FreelancerRenderer {
    render() {
      // Pricing cards redirection CTA trigger
      const pricingBtns = document.querySelectorAll('.pricing-card .plan-cta-btn');
      const flMsgInput = document.querySelector('.freelance-capsule-form textarea');
      
      pricingBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const planName = btn.closest('.pricing-card').querySelector('.plan-name').textContent;
          
          // Auto fill scope description in contact form
          if (flMsgInput) {
            flMsgInput.value = `Hello! I would like to schedule an inquiry regarding the [${planName}] plan. Let's discuss scope, timeline, and deliverables.`;
            flMsgInput.focus();
          }
          
          const target = document.getElementById('secure-terminal');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        });
      });
    }
  }

  // D. Student Theme Renderer (CS/IT Detection logic)
  class StudentRenderer {
    render() {
      // 1. Scan title and academic description for IT tags
      const degreeTitle = document.querySelector('.student-degree-status');
      const eduCards = document.querySelectorAll('#education-student-list .student-academic-card');
      
      let bioTextSearch = degreeTitle ? degreeTitle.textContent : '';
      
      eduCards.forEach(card => {
        bioTextSearch += ' ' + card.innerText;
      });

      // IT keywords filter
      const itKeywords = /computer|science|software|engineering|developer|technology|it|ai|data\s+science|programming|coding/i;
      const isITStudent = itKeywords.test(bioTextSearch);
      
      const itMetricsBlock = document.getElementById('student-it-metrics-container');
      if (itMetricsBlock) {
        if (isITStudent) {
          // Keep block and animate it
          itMetricsBlock.style.display = 'block';
        } else {
          // Non-IT student: Strip developer metrics completely
          itMetricsBlock.remove();
        }
      }
    }
  }

  // E. Business Theme Renderer (Corporate stats count updates)
  class BusinessRenderer {
    render() {
      // Count existing experiences & case studies in DOM
      const execExperienceList = document.getElementById('experience-business-list');
      const execProjectsList = document.querySelector('.business-case-studies-grid');

      const expCount = execExperienceList ? execExperienceList.children.length : 0;
      const projCount = execProjectsList ? execProjectsList.children.length : 0;

      const expCountEl = document.getElementById('stat-experience-count');
      const projCountEl = document.getElementById('stat-projects-count');

      // Animating stats counters
      const animateCount = (el, maxVal) => {
        if (!el || maxVal === 0) return;
        let count = 0;
        const step = Math.ceil(maxVal / 20) || 1;
        const interval = setInterval(() => {
          count += step;
          if (count >= maxVal) {
            el.textContent = `${maxVal}+`;
            clearInterval(interval);
          } else {
            el.textContent = `${count}+`;
          }
        }, 50);
      };

      animateCount(expCountEl, expCount);
      animateCount(projCountEl, projCount);
    }
  }

  /* ==========================================================================
     INITIALIZE ROUTING (TEMPLATE REGISTRY ORCHESTRATION)
     ========================================================================== */
  
  // 1. Process technologies array templates
  parseTechnologies();
  
  // 2. Prune empty optional sections from UI
  pruneEmptySections();
  
  // 3. Bind navigation scroll trackers
  initNavScrollTracker();

  // 4. Instantiate and execute category specific rendering pipeline
  const TemplateRegistry = {
    Developer: new DeveloperRenderer(),
    Designer: new DesignerRenderer(),
    Freelancer: new FreelancerRenderer(),
    Student: new StudentRenderer(),
    Business: new BusinessRenderer()
  };

  const activeRenderer = TemplateRegistry[portfolioType];
  if (activeRenderer) {
    activeRenderer.render();
  }

});
