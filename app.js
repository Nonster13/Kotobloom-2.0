const urlInput = document.querySelector("#ytUrl");
const loadBtn = document.querySelector("#loadBtn");
const videoWrap = document.querySelector("#videoWrap");
const captions = document.querySelector("#captions");
const status = document.querySelector("#status");
const vttFile = document.querySelector("#vttFile");

const popup = document.querySelector("#dictionaryPopup");
const popupWord = document.querySelector("#popupWord");
const popupReading = document.querySelector("#popupReading");
const popupMeaning = document.querySelector("#popupMeaning");
const closePopup = document.querySelector("#closePopup");
const dictionaryContent = document.querySelector("#dictionaryContent");

// --------------------------------------------------
// KOTOBLOOM BACKEND
// --------------------------------------------------

const API_BASE = "https://kotobloom-api.manfredkruja80.workers.dev";

let subtitleCues = [];
let activeCueIndex = -1;
let videoElement = null;
let youtubePlayer = null;
let youtubeReady = false;
let syncInterval = null;
let currentVideoId = null;
let transcriptRequestToken = 0;

// --------------------------------------------------
// AUTOMATIC SUBTITLE BUTTON
// --------------------------------------------------

const autoSubtitleBtn = document.createElement("button");

autoSubtitleBtn.id = "autoSubtitleBtn";
autoSubtitleBtn.textContent = "Get Japanese subtitles";
autoSubtitleBtn.disabled = true;

autoSubtitleBtn.style.cssText = `
  margin: 10px 8px 10px 0;
  padding: 11px 17px;
  border: 1px solid #456449;
  border-radius: 9px;
  background: #233529;
  color: #b6e3a3;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: .2s;
`;

loadBtn.insertAdjacentElement("afterend", autoSubtitleBtn);

autoSubtitleBtn.addEventListener("mouseenter", () => {
  autoSubtitleBtn.style.background = "#304936";
});

autoSubtitleBtn.addEventListener("mouseleave", () => {
  autoSubtitleBtn.style.background = "#233529";
});

autoSubtitleBtn.addEventListener("click", () => {
  if (!currentVideoId) {
    setStatus("Load a YouTube video first.", "error");
    return;
  }

  loadAutomaticSubtitles();
});

// --------------------------------------------------
// DICTIONARY
// --------------------------------------------------

const dictionary = {
  "こんにちは": {
    reading: "こんにちは",
    romaji: "konnichiwa",
    meaning: "hello; good afternoon"
  },
  "ありがとう": {
    reading: "ありがとう",
    romaji: "arigatou",
    meaning: "thank you"
  },
  "私": {
    reading: "わたし",
    romaji: "watashi",
    meaning: "I; me"
  },
  "僕": {
    reading: "ぼく",
    romaji: "boku",
    meaning: "I; me (commonly used by males)"
  },
  "日本": {
    reading: "にほん",
    romaji: "nihon",
    meaning: "Japan"
  },
  "日本語": {
    reading: "にほんご",
    romaji: "nihongo",
    meaning: "Japanese language"
  },
  "学校": {
    reading: "がっこう",
    romaji: "gakkou",
    meaning: "school"
  },
  "先生": {
    reading: "せんせい",
    romaji: "sensei",
    meaning: "teacher"
  },
  "友達": {
    reading: "ともだち",
    romaji: "tomodachi",
    meaning: "friend"
  },
  "今日": {
    reading: "きょう",
    romaji: "kyou",
    meaning: "today"
  },
  "明日": {
    reading: "あした",
    romaji: "ashita",
    meaning: "tomorrow"
  },
  "昨日": {
    reading: "きのう",
    romaji: "kinou",
    meaning: "yesterday"
  },
  "食べる": {
    reading: "たべる",
    romaji: "taberu",
    meaning: "to eat"
  },
  "飲む": {
    reading: "のむ",
    romaji: "nomu",
    meaning: "to drink"
  },
  "見る": {
    reading: "みる",
    romaji: "miru",
    meaning: "to see; to watch"
  },
  "行く": {
    reading: "いく",
    romaji: "iku",
    meaning: "to go"
  },
  "来る": {
    reading: "くる",
    romaji: "kuru",
    meaning: "to come"
  },
  "帰る": {
    reading: "かえる",
    romaji: "kaeru",
    meaning: "to return; to go home"
  },
  "好き": {
    reading: "すき",
    romaji: "suki",
    meaning: "liked; favorite"
  },
  "大好き": {
    reading: "だいすき",
    romaji: "daisuki",
    meaning: "love; really like"
  },
  "分かる": {
    reading: "わかる",
    romaji: "wakaru",
    meaning: "to understand"
  },
  "違う": {
    reading: "ちがう",
    romaji: "chigau",
    meaning: "to be different; that's wrong"
  },
  "何": {
    reading: "なに / なん",
    romaji: "nani / nan",
    meaning: "what"
  },
  "誰": {
    reading: "だれ",
    romaji: "dare",
    meaning: "who"
  },
  "何で": {
    reading: "なんで",
    romaji: "nande",
    meaning: "why; how come"
  },
  "本当": {
    reading: "ほんとう",
    romaji: "hontou",
    meaning: "truth; really"
  },
  "面白い": {
    reading: "おもしろい",
    romaji: "omoshiroi",
    meaning: "interesting; funny"
  },
  "可愛い": {
    reading: "かわいい",
    romaji: "kawaii",
    meaning: "cute"
  },
  "美味しい": {
    reading: "おいしい",
    romaji: "oishii",
    meaning: "delicious"
  },
  "大丈夫": {
    reading: "だいじょうぶ",
    romaji: "daijoubu",
    meaning: "okay; all right"
  },
  "ちょっと": {
    reading: "ちょっと",
    romaji: "chotto",
    meaning: "a little; wait a moment"
  },
  "もう": {
    reading: "もう",
    romaji: "mou",
    meaning: "already; anymore"
  },
  "まだ": {
    reading: "まだ",
    romaji: "mada",
    meaning: "still; not yet"
  },
  "でも": {
    reading: "でも",
    romaji: "demo",
    meaning: "but; however"
  },
  "だから": {
    reading: "だから",
    romaji: "dakara",
    meaning: "so; therefore"
  },
  "そして": {
    reading: "そして",
    romaji: "soshite",
    meaning: "and then"
  }
};

// --------------------------------------------------
// STATUS
// --------------------------------------------------

function setStatus(message, type = "normal") {
  status.textContent = message;

  status.style.color =
    type === "error" ? "#ef8989" :
    type === "success" ? "#b6e3a3" :
    "#849287";
}

// --------------------------------------------------
// YOUTUBE URL HANDLING
// --------------------------------------------------

function extractYouTubeId(value) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return url.pathname.split("/")[1] || null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      const match = url.pathname.match(
        /^\/(?:embed|shorts|live)\/([^/?]+)/
      );

      return match ? match[1] : null;
    }

    return null;
  } catch {
    return null;
  }
}

function loadYouTubeVideo() {
  const videoId = extractYouTubeId(urlInput.value);

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    setStatus("Please enter a valid YouTube video URL.", "error");
    return;
  }

  currentVideoId = videoId;
  transcriptRequestToken++;

  closeDictionaryPopup();
  stopSync();

  subtitleCues = [];
  activeCueIndex = -1;

  renderSubtitles();

  youtubePlayer = null;
  youtubeReady = false;
  videoElement = null;

  autoSubtitleBtn.disabled = false;
  autoSubtitleBtn.textContent = "Get Japanese subtitles";

  videoWrap.innerHTML = `
    <iframe
      id="youtubeFrame"
      src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?enablejsapi=1&origin=${encodeURIComponent(location.origin)}&playsinline=1"
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin">
    </iframe>
  `;

  setStatus("Video loaded. You can now get Japanese subtitles.", "success");

  if (window.YT && window.YT.Player) {
    createYouTubePlayer();
  } else {
    loadYouTubeAPI();
  }
}

function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) {
    createYouTubePlayer();
    return;
  }

  if (document.querySelector("#youtube-api")) return;

  const script = document.createElement("script");
  script.id = "youtube-api";
  script.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(script);
}

window.onYouTubeIframeAPIReady = function () {
  createYouTubePlayer();
};

function createYouTubePlayer() {
  if (!currentVideoId || !window.YT || !window.YT.Player) return;

  const frame = document.querySelector("#youtubeFrame");
  if (!frame) return;

  youtubePlayer = new YT.Player("youtubeFrame", {
    events: {
      onReady: function () {
        youtubeReady = true;

        setStatus(
          subtitleCues.length
            ? "Video ready. Japanese subtitles are loaded."
            : "Video ready. Get Japanese subtitles to begin learning.",
          "success"
        );

        startSync();
      },

      onError: function () {
        setStatus(
          "YouTube couldn't play this video. It may have embedding restrictions.",
          "error"
        );
      }
    }
  });
}

// --------------------------------------------------
// AUTOMATIC JAPANESE SUBTITLES
// --------------------------------------------------

async function loadAutomaticSubtitles() {
  if (!currentVideoId) return;

  const requestToken = ++transcriptRequestToken;
  const videoUrl = `https://www.youtube.com/watch?v=${currentVideoId}`;

  autoSubtitleBtn.disabled = true;
  autoSubtitleBtn.textContent = "Getting subtitles...";

  setStatus(
    "Requesting Japanese subtitles. This may take a little while...",
    "normal"
  );

  try {
    const response = await fetch(`${API_BASE}/transcript`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: videoUrl
      })
    });

    const data = await response.json();

    if (requestToken !== transcriptRequestToken) return;

    if (data.error) {
      throw new Error(
        data.details?.message ||
        data.details?.details ||
        data.message ||
        data.error
      );
    }

    let transcript = data;

    // Large videos may need background processing.
    if (data.jobId) {
      transcript = await waitForTranscript(
        data.jobId,
        requestToken
      );
    }

    if (requestToken !== transcriptRequestToken) return;

    const cues = convertTranscriptToCues(transcript);

    if (!cues.length) {
      throw new Error(
        "The service returned no timestamped Japanese subtitles."
      );
    }

    subtitleCues = cues;
    activeCueIndex = -1;

    renderSubtitles();

    if (youtubeReady || videoElement) {
      startSync();
    }

    autoSubtitleBtn.textContent = "Refresh subtitles";

    setStatus(
      `Successfully loaded ${cues.length} Japanese subtitle lines.`,
      "success"
    );

  } catch (error) {
    if (requestToken !== transcriptRequestToken) return;

    console.error("Kotobloom transcript error:", error);

    setStatus(
      `Couldn't get subtitles: ${error.message}`,
      "error"
    );

    autoSubtitleBtn.textContent = "Try again";

  } finally {
    if (requestToken === transcriptRequestToken) {
      autoSubtitleBtn.disabled = false;
    }
  }
}

// --------------------------------------------------
// ASYNC TRANSCRIPT PROCESSING
// --------------------------------------------------

async function waitForTranscript(jobId, requestToken) {
  const maximumAttempts = 90;

  for (let attempt = 0; attempt < maximumAttempts; attempt++) {
    if (requestToken !== transcriptRequestToken) {
      throw new Error("Transcript request cancelled.");
    }

    await new Promise(resolve => setTimeout(resolve, 2500));

    setStatus(
      `AI is processing the subtitles... (${attempt + 1}/${maximumAttempts})`,
      "normal"
    );

    const response = await fetch(
      `${API_BASE}/transcript/${encodeURIComponent(jobId)}`
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(
        data.details?.message ||
        data.message ||
        data.error ||
        "Transcript processing failed."
      );
    }

    if (data.status === "completed") {
      return data.result || data;
    }

    if (data.status === "failed") {
      throw new Error(
        data.error?.message ||
        data.error?.details ||
        "AI transcription failed."
      );
    }

    if (
      data.content &&
      Array.isArray(data.content)
    ) {
      return data;
    }
  }

  throw new Error(
    "This video is taking too long to process. Please try again later."
  );
}

// --------------------------------------------------
// CONVERT SUPADATA RESPONSE TO KOTOBLOOM CUES
// --------------------------------------------------

function convertTranscriptToCues(response) {
  let content = response?.content;

  // Some completed jobs put the transcript inside result.
  if (!Array.isArray(content) && Array.isArray(response?.result?.content)) {
    content = response.result.content;
  }

  if (!Array.isArray(content)) {
    return [];
  }

  const cues = content
    .map((item, index) => {
      if (!item || typeof item.text !== "string") {
        return null;
      }

      // Supadata offsets and durations are milliseconds.
      const start = Number(item.offset) / 1000;
      const duration = Number(item.duration) / 1000;

      if (!Number.isFinite(start) || start < 0) {
        return null;
      }

      const safeDuration =
        Number.isFinite(duration) && duration > 0
          ? duration
          : 3;

      const text = item.text.trim();

      if (!text) return null;

      return {
        start,
        end: start + safeDuration,
        text
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.start - b.start);

  // Prevent overlapping or zero-length subtitle lines.
  return cues.map((cue, index) => {
    const nextCue = cues[index + 1];

    if (nextCue && cue.end > nextCue.start) {
      return {
        ...cue,
        end: nextCue.start
      };
    }

    return cue;
  }).filter(cue => cue.end > cue.start);
}

// --------------------------------------------------
// SUBTITLE FILE IMPORT
// Supports VTT and SRT
// --------------------------------------------------

function parseTimestamp(timestamp) {
  const value = timestamp.trim().replace(",", ".");
  const parts = value.split(":");

  if (parts.length === 3) {
    return (
      Number(parts[0]) * 3600 +
      Number(parts[1]) * 60 +
      Number(parts[2])
    );
  }

  if (parts.length === 2) {
    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  return NaN;
}

function parseSubtitleFile(text) {
  const normalized = text
    .replace(/^\uFEFF/, "")
    .replace(/\r/g, "")
    .replace(/<br\s*\/?>/gi, "\n");

  const blocks = normalized.split(/\n\s*\n/);
  const result = [];

  for (const block of blocks) {
    const lines = block.split("\n").map(line => line.trim());
    const timingIndex = lines.findIndex(line => line.includes("-->"));

    if (timingIndex === -1) continue;

    const timing = lines[timingIndex].split("-->");
    if (timing.length < 2) continue;

    const start = parseTimestamp(timing[0]);
    const end = parseTimestamp(timing[1].trim().split(/\s+/)[0]);

    const content = lines
      .slice(timingIndex + 1)
      .filter(Boolean)
      .join("\n")
      .replace(/<[^>]*>/g, "")
      .trim();

    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start ||
      !content
    ) continue;

    result.push({ start, end, text: content });
  }

  return result.sort((a, b) => a.start - b.start);
}

vttFile.addEventListener("change", async function () {
  const file = vttFile.files[0];
  if (!file) return;

  // Ignore any automatic transcript request still in progress.
  transcriptRequestToken++;

  try {
    const text = await file.text();
    const parsed = parseSubtitleFile(text);

    if (!parsed.length) {
      setStatus("No valid subtitles found. Check your VTT or SRT file.", "error");
      return;
    }

    subtitleCues = parsed;
    activeCueIndex = -1;

    renderSubtitles();

    setStatus(
      `Successfully imported ${parsed.length} subtitle lines.`,
      "success"
    );

    if (videoElement || youtubeReady) {
      startSync();
    }
  } catch (error) {
    console.error(error);
    setStatus("Couldn't read that subtitle file.", "error");
  }

  vttFile.value = "";
});

// --------------------------------------------------
// SUBTITLE DISPLAY
// --------------------------------------------------

function renderSubtitles() {
  captions.innerHTML = "";

  if (!subtitleCues.length) {
    captions.innerHTML = `
      <div class="subtitle-empty">
        <div>文</div>
        <strong>No subtitles loaded.</strong>
        <p>Get Japanese subtitles or import a subtitle file to begin exploring Japanese.</p>
      </div>
    `;
    return;
  }

  subtitleCues.forEach((cue, index) => {
    const line = document.createElement("div");
    line.className = "subtitle-line";
    line.dataset.index = index;

    line.style.padding = "10px 8px";
    line.style.borderRadius = "7px";
    line.style.marginBottom = "5px";
    line.style.cursor = "pointer";
    line.style.transition = ".2s";

    const timestamp = document.createElement("span");
    timestamp.textContent = formatTime(cue.start);
    timestamp.style.display = "block";
    timestamp.style.fontSize = "9px";
    timestamp.style.color = "#718075";
    timestamp.style.marginBottom = "6px";

    const sentence = document.createElement("div");
    sentence.className = "subtitle-sentence";
    sentence.style.fontSize = "15px";
    sentence.style.lineHeight = "2";
    sentence.style.color = "#e4eee4";

    createClickableWords(cue.text, sentence);

    line.append(timestamp, sentence);

    line.addEventListener("click", function (event) {
      if (event.target.closest(".subtitle-word")) return;
      seekTo(cue.start);
    });

    captions.appendChild(line);
  });
}

function createClickableWords(text, container) {
  const segments = text.match(
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+|[^\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]+/gu
  ) || [text];

  segments.forEach(segment => {
    if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}ー]/u.test(segment)) {
      const word = document.createElement("span");
      word.className = "subtitle-word";
      word.textContent = segment;
      word.style.cursor = "pointer";
      word.style.borderBottom = "1px dotted #8fbd7b";
      word.style.transition = ".15s";

      word.addEventListener("mouseenter", () => {
        word.style.color = "#b6e3a3";
      });

      word.addEventListener("mouseleave", () => {
        word.style.color = "";
      });

      word.addEventListener("click", function (event) {
        event.stopPropagation();
        showDictionary(segment, word);
      });

      container.appendChild(word);
    } else {
      container.appendChild(document.createTextNode(segment));
    }
  });
}

// --------------------------------------------------
// SUBTITLE SYNCHRONIZATION
// --------------------------------------------------

function getCurrentTime() {
  if (videoElement) {
    return videoElement.currentTime;
  }

  if (youtubePlayer && youtubeReady) {
    return youtubePlayer.getCurrentTime();
  }

  return null;
}

function seekTo(seconds) {
  if (videoElement) {
    videoElement.currentTime = seconds;
    return;
  }

  if (youtubePlayer && youtubeReady) {
    youtubePlayer.seekTo(seconds, true);
  }
}

function startSync() {
  stopSync();

  syncInterval = setInterval(() => {
    const currentTime = getCurrentTime();
    if (currentTime === null) return;

    const index = subtitleCues.findIndex(
      cue => currentTime >= cue.start && currentTime < cue.end
    );

    if (index !== activeCueIndex) {
      activeCueIndex = index;
      updateActiveSubtitle(index);
    }
  }, 150);
}

function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}

function updateActiveSubtitle(index) {
  document.querySelectorAll(".subtitle-line").forEach((line, i) => {
    const active = i === index;

    line.style.background = active ? "#233529" : "transparent";
    line.style.borderLeft = active ? "2px solid #b6e3a3" : "2px solid transparent";
    line.style.paddingLeft = "10px";
    line.style.opacity = index === -1 ? "1" : active ? "1" : ".55";
  });

  if (index >= 0) {
    const activeLine = captions.querySelector(
      `.subtitle-line[data-index="${index}"]`
    );

    if (activeLine) {
      activeLine.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

// --------------------------------------------------
// DICTIONARY
// --------------------------------------------------

function showDictionary(word, element) {
  const entry = dictionary[word];

  const reading = entry?.reading || "Reading not found yet";
  const romaji = entry?.romaji || "";
  const meaning = entry?.meaning || "This word isn't in the starter dictionary yet.";

  popupWord.textContent = word;
  popupReading.textContent = `${reading}${romaji ? " · " + romaji : ""}`;
  popupMeaning.textContent = meaning;

  dictionaryContent.innerHTML = `
    <div style="padding:20px 5px;display:flex;align-items:center;gap:20px">
      <div style="font-size:42px;color:#b6e3a3">${escapeHTML(word)}</div>
      <div>
        <div style="font-size:12px;color:#cbd8cc">${escapeHTML(reading)}</div>
        <div style="font-size:11px;color:#849287;margin-top:5px">${escapeHTML(romaji)}</div>
        <div style="font-size:13px;color:#edf3ed;margin-top:9px">${escapeHTML(meaning)}</div>
      </div>
    </div>
  `;

  const rect = element.getBoundingClientRect();

  popup.hidden = false;

  const width = popup.offsetWidth;
  const height = popup.offsetHeight;
  const margin = 12;

  let left = rect.left;
  let top = rect.bottom + 9;

  if (left + width > window.innerWidth - margin) {
    left = window.innerWidth - width - margin;
  }

  if (top + height > window.innerHeight - margin) {
    top = rect.top - height - 9;
  }

  left = Math.max(margin, left);
  top = Math.max(margin, top);

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

function closeDictionaryPopup() {
  popup.hidden = true;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

closePopup.addEventListener("click", closeDictionaryPopup);

document.addEventListener("click", function (event) {
  if (
    !popup.contains(event.target) &&
    !event.target.closest(".subtitle-word")
  ) {
    closeDictionaryPopup();
  }
});

// --------------------------------------------------
// BUTTONS
// --------------------------------------------------

loadBtn.addEventListener("click", loadYouTubeVideo);

urlInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    loadYouTubeVideo();
  }
});

window.addEventListener("beforeunload", stopSync);
window.addEventListener("resize", closeDictionaryPopup);

console.log("Kotobloom 2.0 initialized.");
