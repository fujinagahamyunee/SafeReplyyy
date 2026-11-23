"use strict";

const ACTION_LABELS = {
  clicked: "문자 속 링크를 클릭함",
  installed: "앱 또는 파일을 설치함",
  personal: "개인정보 또는 금융정보를 입력함",
  transfer: "금융 이체를 시도했거나 금전 피해가 확인됨"
};

const RULES = [
  {
    id: "R4",
    stage: 4,
    title: "금융 이체 시도 또는 금전 피해 확인",
    condition: "금융 이체 시도 또는 금전 피해 확인 사실이 선택된 경우",
    reason: "이체 시도 또는 피해 확인 행동이 선택되어 행동 규칙 중 가장 높은 단계인 4단계를 우선 적용했습니다.",
    matches: facts => facts.includes("transfer")
  },
  {
    id: "R3",
    stage: 3,
    title: "앱·파일 설치 또는 정보 입력",
    condition: "앱·파일 설치 또는 개인정보·금융정보 입력 사실이 선택된 경우",
    reason: "설치 또는 정보 입력 행동이 확인되어 3단계 규칙을 적용했습니다.",
    matches: facts => facts.includes("installed") || facts.includes("personal")
  },
  {
    id: "R2",
    stage: 2,
    title: "문자 속 링크 클릭",
    condition: "문자 속 링크를 클릭한 사실이 선택되고, 더 높은 단계의 행동은 선택되지 않은 경우",
    reason: "링크 클릭 사실만 확인되어 2단계 규칙을 적용했습니다. 클릭만으로 감염이나 정보 유출이 확정되는 것은 아닙니다.",
    matches: facts => facts.includes("clicked")
  },
  {
    id: "R1",
    stage: 1,
    title: "의심 문자 수신",
    condition: "문자 수신은 확인되었고, 이후 행동은 선택되지 않은 경우",
    reason: "문자를 받았다는 사실만 있으며 선택된 후속 행동이 없어 1단계 기본 규칙을 적용했습니다.",
    matches: facts => facts.length === 0
  }
];

const STAGES = {
  1: {
    title: "의심 문자만 수신한 상태",
    description: "선택된 행동을 기준으로는 문자 수신만 확인됐어요. 문자 단서만으로 위험 여부를 확정할 수는 없습니다.",
    response: [
      "문자에 답장하거나 링크를 누르지 말고, 발신번호를 차단·스팸 신고하세요.",
      "택배·금융기관 등에서 온 안내라면 문자 링크 대신 공식 앱이나 대표번호로 직접 확인하세요.",
      "휴대전화의 운영체제와 보안 업데이트를 최신 상태로 유지하세요."
    ]
  },
  2: {
    title: "문자 속 링크를 클릭한 상태",
    description: "링크를 눌렀다는 행동이 확인됐어요. 클릭만으로 악성 앱 감염이나 정보 유출이 확정되는 것은 아닙니다.",
    response: [
      "열린 페이지를 닫고, 페이지에서 추가로 정보를 입력하거나 파일을 내려받지 마세요.",
      "다운로드된 파일이나 설치된 앱이 있는지 확인하세요. 확인되면 해당 앱을 실행하지 말고 공식 보안 지원을 받으세요.",
      "모르는 앱 설치를 허용했거나 기기에 이상 징후가 있으면 이동통신사 또는 공인 서비스센터에 문의하세요."
    ]
  },
  3: {
    title: "앱·파일 설치 또는 정보 입력 상태",
    description: "앱·파일 설치 또는 개인정보·금융정보 입력 행동이 선택됐어요. 실제 악용이나 피해 여부는 이 분석만으로 확인할 수 없습니다.",
    response: [
      "금융정보나 인증정보를 입력했다면 해당 금융회사 공식 대표번호로 즉시 연락해 계정·카드 보호 조치를 문의하세요.",
      "같은 비밀번호를 쓰는 계정은 안전한 기기에서 변경하고, 추가 인증 설정과 로그인 내역을 확인하세요.",
      "앱이나 파일을 설치했다면 실행·삭제 여부를 임의로 판단하기보다 공식 보안 지원 또는 서비스센터에 점검을 요청하세요.",
      "계좌·카드 정보가 노출됐을 가능성이 있으면 금융회사에 지급정지 등 가능한 조치를 문의하세요."
    ]
  },
  4: {
    title: "금융 이체 시도 또는 금전 피해 확인",
    description: "이체를 시도했거나 피해를 확인했다는 행동이 선택됐어요. 실제 이체·피해 여부는 금융회사와 관계 기관을 통해 확인해야 합니다.",
    response: [
      "즉시 해당 은행·카드사 공식 대표번호로 연락해 이체 확인, 지급정지, 계정 보호 등 가능한 조치를 요청하세요.",
      "긴급한 범죄 피해가 의심되면 112에 신고하고, 금융 관련 피해 상담은 경찰청 또는 금융회사 안내를 받으세요.",
      "문자, 전화번호, 대화 기록, 이체 내역과 시각을 삭제하지 말고 증거로 보관하세요.",
      "상대방이 안내한 번호가 아닌 카드 뒷면·공식 홈페이지에 기재된 연락처를 사용하세요."
    ]
  }
};

const CLUE_PATTERNS = [
  { label: "URL·웹 주소", regex: /(?:https?:\/\/|www\.)[^\s<>"'()]+|(?:[a-z0-9-]+\.)+(?:kr|com|net|org|io|co)(?:\/[^\s<>"']*)?/i },
  { label: "개인정보 요구 표현", regex: /개인정보|주민등록번호|신분증|성명.{0,8}입력|본인\s*확인|개인\s*정보/ },
  { label: "금융정보 요구 표현", regex: /계좌|카드\s*(?:번호|정보)|비밀번호|인증번호|보안\s*카드|송금|이체|결제/ },
  { label: "긴급·압박 표현", regex: /긴급|즉시|오늘까지|기한.{0,8}(?:마감|만료)|미납|정지(?:됩니다|예정)?|불이익|확인하지\s*않으면|24시간/ },
  { label: "링크·설치 유도 표현", regex: /클릭|접속|링크|설치|다운로드|앱을?\s*받|파일을?\s*열/ }
];

const STAGE_NAMES = {
  1: "1단계 — 의심 문자 수신",
  2: "2단계 — 링크 클릭",
  3: "3단계 — 설치 또는 정보 입력",
  4: "4단계 — 이체 시도 또는 금전 피해 확인"
};

const messageInput = document.querySelector("#message");
const charCount = document.querySelector("#char-count");
const analyzeButton = document.querySelector("#analyze-button");
const resetButton = document.querySelector("#reset-button");
const formStatus = document.querySelector("#form-status");
const resultPanel = document.querySelector("#result-panel");
const emptyResult = document.querySelector("#empty-result");
const analysisResult = document.querySelector("#analysis-result");
const summaryField = document.querySelector("#incident-summary");
const copyStatus = document.querySelector("#copy-status");

messageInput.addEventListener("input", () => {
  charCount.textContent = `${messageInput.value.length.toLocaleString("ko-KR")} / 5,000`;
});

analyzeButton.addEventListener("click", analyze);
resetButton.addEventListener("click", resetForm);
document.querySelector("#copy-button").addEventListener("click", copySummary);

function analyze() {
  const message = messageInput.value.trim();
  const facts = [...document.querySelectorAll('input[name="action"]:checked')].map(input => input.value);
  const firedRules = RULES.filter(rule => rule.matches(facts));
  const winningRule = firedRules[0];
  const stage = winningRule.stage;
  const clues = detectClues(message);
  const selectedActions = facts.map(fact => ACTION_LABELS[fact]);

  renderResult({ message, facts, selectedActions, winningRule, stage, clues });
  formStatus.textContent = "";
  copyStatus.textContent = "";
  resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function detectClues(message) {
  if (!message) return [];
  return CLUE_PATTERNS
    .filter(clue => clue.regex.test(message))
    .map(clue => clue.label);
}

function renderResult({ message, facts, selectedActions, winningRule, stage, clues }) {
  const stageDetails = STAGES[stage];
  emptyResult.hidden = true;
  analysisResult.hidden = false;

  const banner = document.querySelector("#risk-banner");
  banner.dataset.stage = String(stage);
  document.querySelector("#risk-kicker").textContent = "행동 사실에 따른 추론 결과";
  document.querySelector("#risk-stage").textContent = `위험 ${stage}단계`;
  document.querySelector("#risk-title").textContent = stageDetails.title;
  document.querySelector("#risk-description").textContent = stageDetails.description;

  const stageTrack = document.querySelector("#stage-track");
  stageTrack.replaceChildren(...[1, 2, 3, 4].map(number => {
    const item = document.createElement("div");
    item.className = `stage-step${number < stage ? " is-reached" : ""}${number === stage ? " is-current" : ""}`;
    if (number === stage) item.setAttribute("aria-current", "step");
    item.innerHTML = `<span>STAGE 0${number}</span>${number}단계`;
    return item;
  }));

  const ruleCard = document.querySelector("#rule-card");
  ruleCard.replaceChildren();
  const ruleName = document.createElement("div");
  ruleName.className = "rule-name";
  ruleName.textContent = `${winningRule.id} · ${winningRule.title}`;
  const ruleCondition = document.createElement("p");
  ruleCondition.className = "rule-condition";
  ruleCondition.textContent = `조건: ${winningRule.condition}`;
  const ruleReason = document.createElement("p");
  ruleReason.className = "rule-reason";
  ruleReason.textContent = `판단 근거: ${winningRule.reason}`;
  ruleCard.append(ruleName, ruleCondition, ruleReason);

  const clueList = document.querySelector("#clue-list");
  clueList.replaceChildren(...clues.map(clue => {
    const chip = document.createElement("span");
    chip.className = "clue-chip";
    chip.textContent = clue;
    return chip;
  }));
  document.querySelector("#no-clues").hidden = clues.length > 0;

  const responseList = document.querySelector("#response-list");
  responseList.replaceChildren(...stageDetails.response.map(response => {
    const item = document.createElement("li");
    item.textContent = response;
    return item;
  }));
  summaryField.value = createSummary({ message, facts, selectedActions, winningRule, stage, clues });
}

function createSummary({ message, facts, selectedActions, winningRule, stage, clues }) {
  const actionsText = selectedActions.length ? selectedActions.join(", ") : "선택한 행동 없음 (문자 수신만)";
  const clueText = clues.length ? clues.join(", ") : "탐지된 단서 없음";
  const messageText = message || "입력하지 않음";
  return [
    "[SafeReply 상담·신고 참고 요약]",
    `추론 단계: ${STAGE_NAMES[stage]}`,
    `적용 규칙: ${winningRule.id} — ${winningRule.title}`,
    `선택한 행동: ${actionsText}`,
    `문자 단서(단계 추론과 별도): ${clueText}`,
    `문자 내용: ${messageText}`,
    "참고: 자동 생성된 참고 정보이며 실제 감염·정보 유출·금전 피해를 확정하지 않습니다."
  ].join("\n");
}

async function copySummary() {
  if (!summaryField.value) {
    copyStatus.textContent = "먼저 위험 단계 분석을 실행해 주세요.";
    return;
  }
  try {
    await navigator.clipboard.writeText(summaryField.value);
    copyStatus.textContent = "사고 요약을 클립보드에 복사했어요.";
  } catch (error) {
    summaryField.focus();
    summaryField.select();
    const copied = document.execCommand("copy");
    if (copied) {
      copyStatus.textContent = "사고 요약을 클립보드에 복사했어요.";
    } else {
      copyStatus.textContent = "자동 복사에 실패했어요. 요약 내용을 선택해 직접 복사해 주세요.";
    }
  }
}

function resetForm() {
  messageInput.value = "";
  charCount.textContent = "0 / 5,000";
  document.querySelectorAll('input[name="action"]').forEach(input => { input.checked = false; });
  emptyResult.hidden = false;
  analysisResult.hidden = true;
  summaryField.value = "";
  formStatus.textContent = "";
  copyStatus.textContent = "";
  messageInput.focus();
}
