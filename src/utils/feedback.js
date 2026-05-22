(function () {
  const btn = document.getElementById('feedback-btn');
  const webhookUrl = window.__FEEDBACK_WEBHOOK__;
  if (!btn) return;

  const modal = document.getElementById('feedback-modal');
  const backdrop = document.getElementById('feedback-backdrop');
  const closeBtn = document.getElementById('feedback-close');
  const category = document.getElementById('feedback-category');
  const sections = {
    simple: document.getElementById('fb-section-simple'),
    'link-request': document.getElementById('fb-section-link-request'),
    rating: document.getElementById('fb-section-rating')
  };
  const fbText = document.getElementById('fb-text');
  const flinkUrl = document.getElementById('flink-url');
  const flinkBrief = document.getElementById('flink-brief');
  const flinkDetail = document.getElementById('flink-detail');
  const fratingAction = document.getElementById('frating-action');
  const fratingUrl = document.getElementById('frating-url');
  const fratingReason = document.getElementById('frating-reason');
  const fbEmail = document.getElementById('fb-email');
  const fbDiscord = document.getElementById('fb-discord');
  const submitBtn = document.getElementById('fb-submit');
  const charCount = document.getElementById('fb-charcount');
  const successEl = document.getElementById('fb-success');
  const errorEl = document.getElementById('fb-error');

  if (!webhookUrl) {
    errorEl.textContent = 'Webhook not configured. Ask the site admin to set up DISCORD_FEEDBACK_WEBHOOK.';
  }

  const motiveLabels = {
    thanks: 'Say Thanks',
    suggestion: 'Wiki Improvement Suggestion',
    'link-request': 'Add Link Request',
    rating: 'Star/Unstar/Remove Suggestion'
  };

  var catToSection = {
    thanks: 'simple',
    suggestion: 'simple',
    'link-request': 'link-request',
    rating: 'rating'
  };

  function switchSection(val) {
    var sec = catToSection[val] || '';
    Object.keys(sections).forEach(function (k) {
      sections[k].style.display = k === sec ? '' : 'none';
    });
    if (!sec) sections.simple.style.display = '';
    charCount.textContent = '0 / 1000';
    checkValidity();
  }

  function openModal() {
    modal.classList.add('open');
  }

  function closeModal() {
    modal.classList.remove('open');
    category.value = '';
    switchSection('simple');
    fbText.value = '';
    flinkUrl.value = '';
    flinkBrief.value = '';
    flinkDetail.value = '';
    fratingAction.value = 'star';
    fratingUrl.value = '';
    fratingReason.value = '';
    fbEmail.value = '';
    fbDiscord.value = '';
    submitBtn.disabled = true;
    charCount.textContent = '0 / 1000';
    successEl.style.display = 'none';
    errorEl.style.display = 'none';
  }

  function checkValidity() {
    var valid = false;
    var cat = category.value;
    var hasContact = fbEmail.value.trim() || fbDiscord.value.trim();

    if (cat === 'thanks' || cat === 'suggestion') {
      var text = fbText.value.trim();
      valid = text.length > 0 && text.length <= 1000 && hasContact;
    } else if (cat === 'link-request') {
      var url = flinkUrl.value.trim();
      var brief = flinkBrief.value.trim();
      valid = url.length > 0 && brief.length > 0 && brief.length <= 500 && hasContact;
    } else if (cat === 'rating') {
      var rurl = fratingUrl.value.trim();
      var reason = fratingReason.value.trim();
      valid = rurl.length > 0 && reason.length > 0 && reason.length <= 1000 && hasContact;
    }

    submitBtn.disabled = !valid;
  }

  btn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  backdrop.addEventListener('click', closeModal);

  category.addEventListener('change', function () {
    switchSection(this.value);
  });

  fbText.addEventListener('input', function () {
    var len = this.value.length;
    charCount.textContent = len + ' / 1000';
    checkValidity();
  });

  flinkUrl.addEventListener('input', checkValidity);
  flinkBrief.addEventListener('input', function () {
    var len = this.value.length;
    charCount.textContent = len + ' / 500';
    checkValidity();
  });
  flinkDetail.addEventListener('input', function () {
    charCount.textContent = this.value.length + ' / 1000';
  });

  fratingUrl.addEventListener('input', checkValidity);
  fratingReason.addEventListener('input', function () {
    var len = this.value.length;
    charCount.textContent = len + ' / 1000';
    checkValidity();
  });

  fbEmail.addEventListener('input', checkValidity);
  fbDiscord.addEventListener('input', checkValidity);

  submitBtn.addEventListener('click', async function () {
    if (!webhookUrl) {
      errorEl.style.display = 'block';
      return;
    }

    var cat = category.value;
    var email = fbEmail.value.trim();
    var discord = fbDiscord.value.trim();
    if (!email && !discord) return;

    var contact = email ? '📧 ' + email : '💬 ' + discord;
    var embed = {
      color: 0x6750A4,
      timestamp: new Date().toISOString(),
      footer: { text: 'The Way of Internet' }
    };

    if (cat === 'thanks' || cat === 'suggestion') {
      var text = fbText.value.trim();
      if (!text || text.length > 1000) return;
      embed.title = motiveLabels[cat] + ' — Feedback';
      embed.description = text;
      embed.fields = [
        { name: 'Contact', value: contact, inline: true },
        { name: 'Category', value: motiveLabels[cat], inline: true }
      ];
    } else if (cat === 'link-request') {
      var url = flinkUrl.value.trim();
      var brief = flinkBrief.value.trim();
      var detail = flinkDetail.value.trim();
      if (!url || !brief) return;
      embed.title = '🔗 Add Link Request';
      embed.description = url;
      embed.fields = [
        { name: 'Contact', value: contact, inline: true },
        { name: 'Brief', value: brief, inline: true }
      ];
      if (detail) {
        embed.fields.push({ name: 'Details', value: detail, inline: false });
      }
    } else if (cat === 'rating') {
      var rurl = fratingUrl.value.trim();
      var reason = fratingReason.value.trim();
      var action = fratingAction.value;
      var actionLabels = { star: '⭐ Star', unstar: '☆ Unstar', remove: '🗑 Remove' };
      if (!rurl || !reason) return;
      embed.title = actionLabels[action] + ' Suggestion';
      embed.description = rurl;
      embed.fields = [
        { name: 'Contact', value: contact, inline: true },
        { name: 'Reason', value: reason, inline: false }
      ];
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      var res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (!res.ok) throw new Error('Failed');

      successEl.style.display = 'block';
      errorEl.style.display = 'none';
      submitBtn.textContent = 'Sent!';
      setTimeout(function () {
        closeModal();
        submitBtn.textContent = 'Send';
      }, 1500);
    } catch (err) {
      errorEl.style.display = 'block';
      successEl.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send';
    }
  });
})();
