const countdowns = {};

const e = name => $(`<${name}></${name}>`);

$(document).ready(() => {
  $.ajax({
    type: 'POST',
    url: '/bots'
  }).done(botData => render(botData));
})

function getCount(lastRun, interval) {
  return moment("1900-01-01 00:00:00").add(moment(lastRun).add(interval, 'm').diff(moment()), 'milliseconds').format('HH:mm:ss').replace(/^(00:0?)+/, '');
}

function render(botData) {
  botData.forEach(bot => {
    $.get('/views/bot.ejs', template => {
      const id = bot.id;
      const botDiv = ejs.compile(template)({ bot });
      const $idDiv = $(`#${id}`);
      if ($idDiv.length)
        $idDiv.replaceWith(botDiv)
      else
        $('.bots').prepend(botDiv);
      addHandlers(id);
      if (bot.running) {
        const interval = bot.interval;
        const lastRun = bot.lastRun;
        const $countdownDiv = $(`#${id} .countdown`);
        clearInterval(countdowns[id]);
        $countdownDiv.text(getCount(lastRun, interval));
        countdowns[id] = setInterval(() => {
          $countdownDiv.text(getCount(lastRun, interval));
          if (getCount(lastRun, interval) === '0:00') {
            clearInterval(countdowns[id]);
            setTimeout(() => {
              handleResponse(JSON.stringify({id, action: 'render'}));
            }, 5000);
          }
        }, 1000);
      } else if (!bot.running && countdowns[id]) {
        clearInterval(countdowns[id]);
        countdowns[id] = null;
      }
    })
  })
}

function handleResponse(resp) {
  const response = JSON.parse(resp);
  if (response.message) showMessage(response);
  if (response.id) {
    const id = response.id;
    if (response.action === 'delete') $(`#${id}`).remove();
    else if (response.action === 'render') {
      $.ajax({
        type: 'POST',
        url: '/bots',
        data: { id }
      }).done(botData => render(botData));
    }
  }
}

function addHandlers(id) {
  $(`#${id} .playpause`).click(() => {
    $.ajax({
      type: 'POST',
      url: `/toggle/${id}`
    }).done(handleResponse)
  })

  $(`#${id} .run`).click(() => {
    $.ajax({
      type: 'POST',
      url: `/run/${id}`
    }).done(handleResponse)
  })

  $(`#${id} .edit`).click(() => {
    $.ajax({
      type: 'POST',
      url: `/edit/${id}`
    }).done(handleResponse)
  })

  $(`#${id} .configure`).submit(() => {
    const data = {};
    const err = [];
    $.each($(`#${id} .config`), function() {
      const value = $(this).val();
      const key = $(this).attr('name');
      if (value === '') {
        err[0] = ('Please complete all fields.');
        $(this).addClass('highlight');
      } else if (key === 'interval' && isNaN(value)) {
        err[1] = ('Interval must be number.');
        $(this).addClass('highlight');
      } else {
        data[key] = value;
        $(this).removeClass('highlight');
      }
    })
    if (err.length)
      handleResponse(JSON.stringify({id, action: null, message: {type: 'error', text: err.join(' ')}}));
    else {
      $.ajax({
        data,
        type: 'POST',
        url: `/update/${id}`
      }).done(handleResponse)
    }
  })
}

function showMessage(response) {
  const $messageDiv = e('div').addClass(`message ${response.message.type}`);
  const $span = e('span').text(`${response.id}: ${response.message.text}`);
  const $closeBtn = e('i').addClass('fa fa-times-circle close').click(() => $messageDiv.remove())
  $messageDiv.append($span, $closeBtn);
  const $message = $('.message');
  if ($message.length)
    $message.replaceWith($messageDiv)
  else
    $('body').prepend($messageDiv)
  window.scrollTo(0, 0);
  setInterval(() => {
    $messageDiv.remove()
  }, 6000);
}
