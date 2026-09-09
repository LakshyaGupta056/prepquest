import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import LoadingScreen from "../components/LoadingScreen";
import Toast from "../components/Toast";
import { generateTest } from "../api";
import styles from "./TestSetup.module.css";

const MAX_PASTED_CHARS = 50000;
const QUESTION_PRESETS = [10, 25, 50, 65];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".png", ".jpg", ".jpeg", ".txt"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const DIFFICULTY_OPTIONS = [
  { value: "same", label: "Same as actual exam" },
  { value: "harder", label: "Harder" },
  { value: "much_harder", label: "Much Harder" },
];

export default function TestSetup() {
  const { displayName, setTestConfig, setTestPaper } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState("paste");
  const [pastedText, setPastedText] = useState("");
  const [topicName, setTopicName] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const [examName, setExamName] = useState("");
  const [difficulty, setDifficulty] = useState("same");
  const [numQuestions, setNumQuestions] = useState(25);
  const [customCount, setCustomCount] = useState("");

  const [timerEnabled, setTimerEnabled] = useState(false);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState(90);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setFileError("");
    if (!file) {
      setUploadedFile(null);
      return;
    }
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      setFileError(`Unsupported file type. Allowed: ${ACCEPTED_EXTENSIONS.join(", ")}`);
      setUploadedFile(null);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setFileError("File is too large (max 10 MB).");
      setUploadedFile(null);
      e.target.value = "";
      return;
    }
    setUploadedFile(file);
  }

  function handlePresetClick(n) {
    setNumQuestions(n);
    setCustomCount("");
  }

  function handleCustomCountChange(e) {
    const raw = e.target.value;
    setCustomCount(raw);
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n)) {
      setNumQuestions(Math.min(100, Math.max(1, n)));
    }
  }

  function validate() {
    if (!examName.trim()) {
      return "Tell us which exam this is for (e.g. \"GATE Mechanical\").";
    }
    const hasContent = pastedText.trim() || topicName.trim() || uploadedFile;
    if (!hasContent) {
      return "Add some study notes, a topic/exam reference, or upload a file to continue.";
    }
    if (pastedText.length > MAX_PASTED_CHARS) {
      return `Pasted text is too long (${pastedText.length.toLocaleString()} / ${MAX_PASTED_CHARS.toLocaleString()} characters). Please trim it down.`;
    }
    if (!(numQuestions >= 1 && numQuestions <= 100)) {
      return "Number of questions must be between 1 and 100.";
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError("");
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("exam_name", examName.trim());
    formData.append("difficulty", difficulty);
    formData.append("num_questions", String(numQuestions));
    if (pastedText.trim()) formData.append("pasted_text", pastedText.trim());
    if (topicName.trim()) formData.append("topic_name", topicName.trim());
    if (uploadedFile) formData.append("uploaded_file", uploadedFile);

    try {
      const testPaper = await generateTest(formData);
      setTestConfig({
        examName: examName.trim(),
        difficulty,
        numQuestions,
        timerEnabled,
        secondsPerQuestion: timerEnabled ? secondsPerQuestion : null,
      });
      setTestPaper(testPaper);
      navigate("/test");
    } catch (err) {
      setIsSubmitting(false);
      setToastMessage(err.message || "Couldn't generate your test — try again in a moment.");
    }
  }

  if (isSubmitting) {
    return <LoadingScreen />;
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <p className={styles.greeting}>{displayName ? `Let's build your test, ${displayName}.` : "Let's build your test."}</p>
        <h1 className={styles.title}>Test setup</h1>

        <form onSubmit={handleSubmit} className={styles.layout}>
          <div className={styles.mainCol}>
            {/* Content input */}
            <section className="card" style={{ padding: 20 }}>
              <h2 className={styles.sectionTitle}>Study content</h2>
              <p className={styles.sectionHint}>Mix and match — paste notes, upload a file, and/or name a topic. Anything you fill in gets used.</p>

              <div className={styles.tabs} role="tablist">
                <TabButton active={activeTab === "paste"} onClick={() => setActiveTab("paste")}>
                  Paste text
                </TabButton>
                <TabButton active={activeTab === "upload"} onClick={() => setActiveTab("upload")}>
                  Upload file
                </TabButton>
                <TabButton active={activeTab === "topic"} onClick={() => setActiveTab("topic")}>
                  Topic / exam reference
                </TabButton>
              </div>

              {activeTab === "paste" && (
                <div className={styles.tabPanel}>
                  <textarea
                    className={styles.textarea}
                    placeholder="Paste your notes, textbook excerpt, or lecture content here…"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    rows={8}
                  />
                  <span className={`${styles.charCount} ${pastedText.length > MAX_PASTED_CHARS ? styles.charCountOver : ""}`}>
                    {pastedText.length.toLocaleString()} / {MAX_PASTED_CHARS.toLocaleString()} characters
                  </span>
                </div>
              )}

              {activeTab === "upload" && (
                <div className={styles.tabPanel}>
                  <label className={styles.dropzone} htmlFor="fileUpload">
                    <input
                      id="fileUpload"
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPTED_EXTENSIONS.join(",")}
                      onChange={handleFileChange}
                      className="visually-hidden"
                    />
                    {uploadedFile ? (
                      <span className={styles.fileName}>📄 {uploadedFile.name}</span>
                    ) : (
                      <>
                        <span className={styles.dropzoneTitle}>Click to choose a file</span>
                        <span className={styles.dropzoneHint}>PDF, DOCX, PNG, JPG, or TXT — max 10 MB</span>
                      </>
                    )}
                  </label>
                  {fileError && <p className={styles.fieldError}>{fileError}</p>}
                </div>
              )}

              {activeTab === "topic" && (
                <div className={styles.tabPanel}>
                  <input
                    className={styles.input}
                    type="text"
                    placeholder='e.g. "Thermodynamics" or "GATE 2023 ECE Signals and Systems"'
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                  />
                </div>
              )}
            </section>

            {/* Exam field */}
            <section className="card" style={{ padding: 20 }}>
              <h2 className={styles.sectionTitle}>Exam</h2>
              <p className={styles.sectionHint}>We calibrate syllabus emphasis, style, and marking to whatever you type here.</p>
              <input
                className={styles.input}
                type="text"
                placeholder='e.g. "GATE Mechanical", "UGC NET Computer Science", "GRE Quant"'
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
              />
            </section>

            {/* Difficulty */}
            <section className="card" style={{ padding: 20 }}>
              <h2 className={styles.sectionTitle}>Difficulty</h2>
              <div className={styles.difficultyRow}>
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`${styles.difficultyOption} ${difficulty === opt.value ? styles.difficultyOptionActive : ""}`}
                    onClick={() => setDifficulty(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Question count */}
            <section className="card" style={{ padding: 20 }}>
              <h2 className={styles.sectionTitle}>Number of questions</h2>
              <div className={styles.presetRow}>
                {QUESTION_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${styles.presetChip} ${numQuestions === n && !customCount ? styles.presetChipActive : ""}`}
                    onClick={() => handlePresetClick(n)}
                  >
                    {n}
                  </button>
                ))}
                <input
                  className={styles.customCount}
                  type="number"
                  min={1}
                  max={100}
                  placeholder="Custom"
                  value={customCount}
                  onChange={handleCustomCountChange}
                />
              </div>
            </section>

            {/* Timer */}
            <section className="card" style={{ padding: 20 }}>
              <h2 className={styles.sectionTitle}>Timer</h2>
              <label className={styles.checkboxRow}>
                <input type="checkbox" checked={timerEnabled} onChange={(e) => setTimerEnabled(e.target.checked)} />
                Enable per-question timer
              </label>
              {timerEnabled && (
                <div className={styles.secondsRow}>
                  <input
                    className={styles.secondsInput}
                    type="number"
                    min={10}
                    max={600}
                    value={secondsPerQuestion}
                    onChange={(e) => setSecondsPerQuestion(Math.max(10, Math.min(600, parseInt(e.target.value, 10) || 10)))}
                  />
                  <span className={styles.sectionHint}>seconds per question</span>
                </div>
              )}
              <p className={styles.sectionHint} style={{ marginTop: 10 }}>
                The overall test stopwatch always runs, regardless of this setting.
              </p>
            </section>

            {/* Negative marking note */}
            <div className={styles.infoNote}>
              <strong>GATE-style marking:</strong> each question is worth 1 or 2 marks. A wrong
              answer costs −1/3 of that question's marks. Unattempted questions score 0.
            </div>
          </div>

          <div className={styles.sideCol}>
            <div className={`card ${styles.summaryCard}`}>
              <h3 className={styles.sectionTitle}>Summary</h3>
              <SummaryRow label="Exam" value={examName || "—"} />
              <SummaryRow label="Difficulty" value={DIFFICULTY_OPTIONS.find((d) => d.value === difficulty).label} />
              <SummaryRow label="Questions" value={numQuestions} />
              <SummaryRow label="Per-question timer" value={timerEnabled ? `${secondsPerQuestion}s` : "Off"} />

              {formError && <p className={styles.fieldError}>{formError}</p>}

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 12 }}>
                Generate my test
              </button>
            </div>
          </div>
        </form>
      </div>

      <Toast message={toastMessage} variant="error" onClose={() => setToastMessage("")} />
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button type="button" role="tab" aria-selected={active} className={`${styles.tab} ${active ? styles.tabActive : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className={styles.summaryRow}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  );
}
