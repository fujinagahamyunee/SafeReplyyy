"use strict";

const ACTION_LABELS = {
  received: "의심 문자만 수신함",
  clicked: "문자 속 링크를 클릭함",
  installed: "앱 또는 파일을 설치함",
  personal: "개인정보를 입력함",
  financial: "금융정보를 입력함",
  transfer: "금융 이체를 시도함",
  damage: "실제 금전 피해가 확인됨"
};

const RULES = [
  {
    id: "R4",
    stage: 4,
    title: "금융 이체 시도 또는 실제 금전 피해 확인",
    condition: "금융 이체 시도 또는 실제 금전 피해 확인 사실이 선택된 경우",
    reason: "이체 시도 또는 피해 확인 행동이 선택되어 행동 규칙 중 가장 높은 단계인 4단계를 우선 적용했습니다.",
    matches: facts => facts.includes("transfer") || facts.includes("damage")
  },
  {
    id: "R3",
    stage: 3,
    title: "앱·파일 설치 또는 개인정보·금융정보 입력",
    condition: "앱·파일 설치 또는 개인정보 또는 금융정보 입력 사실이 선택된 경우",
    reason: "앱·파일 설치 또는 개인정보·금융정보 입력 행동이 확인되어 3단계 규칙을 적용했습니다.",
    matches: facts => facts.includes("installed") || facts.includes("personal") || facts.includes("financial")
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
    condition: "문자를 수신했으며 링크 클릭, 설치, 정보 입력, 이체 시도 또는 피해 확인 행동은 선택되지 않은 경우",
    reason: "문자 수신 사실만 확인되었거나 의심 문자를 수신한 항목만 선택되어 1단계 기본 규칙을 적용했습니다.",
    matches: facts => facts.length === 0 || facts.every(fact => fact === "received")
  }
];

const STAGES = {
  1: {
    title: "의심 문자만 수신한 상태",
    description: "아직 링크를 누르거나 앱을 설치하지 않았고 개인정보, 금융정보도 제공하지 않은 상태입니다. 지금은 의심 문자 수신만 확인됐으며, 추가 피해는 확인되지 않았습니다.",
    response: [
      "문자에 답장하지 말고 링크를 누르지 마세요. 통신사 스팸 신고 기능과 휴대전화의 차단 기능을 사용해 발신번호를 차단하고 원본 문자와 스크린샷을 보관하세요.",
      "택배, 카드사, 은행, 정부 기관을 사칭한 내용이라면 문자 속 번호나 링크가 아니라 공식 앱의 알림, 직접 입력한 공식 홈페이지 또는 카드 뒷면과 명세서에 있는 공식 전화번호로 사실 여부를 확인하세요.",
      "문자에 계좌이체, 인증번호 요구, 개인정보 제출을 급하게 요청하는 표현이 있으면 실제 기관에 먼저 직접 확인하세요.",
      "휴대전화의 운영체제와 보안 앱을 최신 상태로 유지하고 출처가 불분명한 앱 권한 요청은 허용하지 마세요.",
      "생체인식 잠금과 보안 비밀번호를 설정해 다른 사람이 휴대전화를 임의로 사용할 수 없도록 보호하세요."
    ]
  },
  2: {
    title: "문자 속 링크를 클릭한 상태",
    description: "문자 속 링크를 누른 행동은 확인됐지만 앱 설치, 개인정보 또는 금융정보 입력과 금전 피해는 선택되지 않았습니다. 단순 클릭만으로 감염이나 정보 유출이 발생했는지는 확정할 수 없습니다.",
    response: [
      "열린 브라우저 탭과 창을 닫고 페이지에서 비밀번호, 인증번호, 주민등록번호, 카드번호, 계좌번호를 입력하지 않았는지 확인하세요.",
      "문자 링크를 통해 앱 설치 화면이 열리거나 권한을 요청한 적이 있다면 설치 목록과 휴대전화의 앱 권한을 확인하세요.",
      "최근 다운로드한 파일과 설치한 앱을 확인해 출처가 불분명한 앱은 실행하지 마세요. 삭제가 어렵거나 기기가 평소와 다르게 작동하면 공식 공인 서비스센터나 이동통신사에 점검을 요청하세요.",
      "광고 팝업이 반복되거나 화면 잠금이 풀리지 않으면 전원을 완전히 끄고 공식 제조사 또는 이동통신사 고객센터에 도움을 요청하세요.",
      "이후 계정에 비정상 로그인이나 결제 알림이 없는지 며칠간 확인하고 의심 문자는 증거로 보관하세요."
    ]
  },
  3: {
    title: "앱·파일 설치 또는 개인정보·금융정보 입력 상태",
    description: "앱 또는 파일 설치, 개인정보 입력 또는 금융정보 입력 행동이 확인됐습니다. 정보가 실제로 악용됐는지, 기기에 악성 코드가 설치됐는지는 이 분석만으로 확정할 수 없지만 즉시 추가 보호 조치가 필요할 수 있습니다.",
    response: [
      "금융정보, 인증번호 또는 간편결제 정보를 입력했다면 문자나 전화로 받은 번호가 아니라 카드 뒷면, 계좌 명세서 또는 공식 앱에 표시된 번호로 즉시 해당 금융회사에 연락해 카드 정지, 계좌 지급정지, 비밀번호 변경 및 로그인 차단 가능성을 문의하세요.",
      "비밀번호나 인증번호를 입력했다면 안전하다고 확신할 수 있는 별도 기기에서 즉시 비밀번호를 변경하고 2단계 인증을 설정하세요. 다른 서비스에 같은 비밀번호를 사용했다면 각 서비스의 비밀번호도 모두 변경하세요.",
      "이름, 주소, 주민등록번호와 같이 신원을 확인할 수 있는 개인정보를 입력했다면 통신사 명의도용 방지 서비스와 금융회사 계정 보호 설정을 확인하고 이상 거래가 있는지 살펴보세요.",
      "출처가 의심되는 앱이나 파일을 설치했다면 실행하거나 원격 제어 권한을 허용하지 말고 공식 보안 점검이나 공인 서비스센터에 기기 진단을 요청하세요.",
      "앱의 접근 권한에서 연락처, 문자, 화면 캡처, 접근성 기능, 설치 권한이 허용돼 있다면 안전한 기기에서 먼저 계정을 보호한 뒤 의심 앱의 권한을 검토하세요.",
      "상대방과의 문자 대화, 링크 주소, 앱 이름, 입력 화면 캡처, 설치 시각을 보관하고 다른 사람에게 인증번호나 비밀번호를 요구해도 제공하지 마세요."
    ]
  },
  4: {
    title: "금융 이체 시도 또는 실제 금전 피해 확인",
    description: "금융 이체를 시도했거나 실제 금전 피해가 확인된 상태입니다. 피해가 발생했거나 진행 중일 가능성이 있으므로 지금 바로 금융기관에 연락하고 관계 기관에 신고해야 합니다.",
    response: [
      "지금 즉시 은행·카드사 공식 대표번호로 전화해 이체 내역을 확인하고 지급정지 또는 계좌·카드 정지 등 가능한 보호 조치를 요청하세요. 상담원 이름과 접수번호를 기록하세요.",
      "이체가 성공했더라도 가해자에게 추가로 돈을 보내지 마세요. 상대방이 환급, 수사 협조, 세금 공제 등을 이유로 추가 이체를 요구하면 별도의 사기일 가능성이 높습니다.",
      "긴급한 범죄 피해가 의심되면 112 또는 경찰청 민원 서비스에 신고하고, 금융기관에서 안내하는 지급정지 신고 절차를 빠르게 진행하세요.",
      "해당 문자, 전화번호, 대화방 링크, 앱 이름, 이체 내역, 거래 상대 계좌, 발생 시각과 금액을 삭제하지 말고 사진이나 문서로 증거를 보관하세요.",
      "상대방이 안내한 링크나 전화번호를 사용하지 말고 카드 뒷면, 공식 웹사이트 주소, 은행 앱에 등록된 공식 문의처로만 연락하세요.",
      "이후 경찰이나 금융기관의 사후 확인이 끝날 때까지 계좌와 카드 명세서의 출금, 결제 내역을 매일 확인하고 의심스러운 거래가 추가로 발생하면 다시 즉시 신고하세요."
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
  3: "3단계 — 앱·파일 설치 또는 정보 입력",
  4: "4단계 — 이체 시도 또는 실제 금전 피해 확인"
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
