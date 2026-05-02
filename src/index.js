const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Builder</title>
<script src="[cdn.tailwindcss.com](https://cdn.tailwindcss.com)"><\/script>
</head>
<body class="bg-gray-950 text-white min-h-screen flex flex-col items-center justify-center p-8">
<div class="max-w-xl w-full text-center">
  <h1 class="text-4xl font-bold mb-4">Build anything.</h1>
  <p class="text-gray-400 text-lg mb-8">Describe your idea. AI builds it. You own the code forever — no subscriptions, no hostages.</p>
  <textarea id="prompt" placeholder="e.g. A todo list app..." class="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white text-sm resize-none h-28 focus:outline-none mb-4"></textarea>
  <button onclick="build()" id="btn" class="w-full bg-white text-gray-950 font-medium py-3 rounded-xl hover:bg-gray-100 transition">Build it →</button>
  <p id="status" class="text-gray-400 text-sm mt-4 hidden"></p>
  <p class="text-gray-600 text-xs mt-4">Your code. Your ownership. Always.</p>
</div>
<script>
async function build() {
  const prompt = document.getElementById('prompt').value.trim();
  if (!prompt) return;
  const btn = document.getElementById('btn');
  const status = document.getElementById('status');
  status.classList.add('hidden');
  btn.disabled = true;
  const msgs = ['Thinking deeply...','Designing your idea...','Writing the code...','Almost there...'];
  let i = 0;
  btn.textContent = msgs[0];
  const interval = setInterval(() => { btn.textContent = msgs[++i % msgs.length]; }, 2000);
  try {
    const res = await fetch('/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    clearInterval(interval);
    const data = await res.json();
    if (data.html) {
      const blob = new Blob([data.html], { type: 'text/html' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'my-build.html';
      a.click();
      btn.textContent = 'Done! Check your downloads.';
      btn.disabled = false;
    } else {
      status.textContent = 'Error: ' + (data.error || 'Unknown error');
      status.classList.remove('hidden');
      btn.textContent = 'Something went wrong. Try again.';
      btn.disabled = false;
    }
  } catch(e) {
    clearInterval(interval);
    status.textContent = 'Error: ' + e.message;
    status.classList.remove('hidden');
    btn.textContent = 'Something went wrong. Try again.';
    btn.disabled = false;
  }
}
<\/script>
</body>
</html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/build' && request.method === 'POST') {
      try {
        const { prompt } = await request.json();

        if (!prompt) {
          return new Response(JSON.stringify({ error: 'No prompt provided' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const response = await fetch('[api.anthropic.com](https://api.anthropic.com/v1/messages)', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-opus-4-5',
            max_tokens: 8000,
            system: 'You are an expert web developer. Respond with ONLY a complete self-contained HTML file. No explanations. No markdown. No code fences. Just raw HTML starting with <!DOCTYPE html>.',
            messages: [{ role: 'user', content: prompt }]
          })
        });

        const data = await response.json();

        if (data.error) {
          return new Response(JSON.stringify({ error: data.error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        const html = data.content?.[0]?.text || '';
        return new Response(JSON.stringify({ html }), {
          headers: { 'Content-Type': 'application/json' }
        });

      } catch(e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(HTML, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};
