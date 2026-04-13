export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      {/* gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/5" />
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-6 py-20 sm:py-28">
        <span className="inline-block rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          AI-Powered
        </span>

        <h1
          className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl"
          style={{ whiteSpace: "pre-line" }}
        >
          {"궁금한 건 AI에게,\n글은 자동으로."}
        </h1>

        <p className="mt-5 max-w-xl text-lg leading-relaxed text-secondary">
          주제를 던지면 인터랙티브 기술 글이 생성됩니다. 코드 플레이그라운드, 단계별 시각화, 시리즈
          자동 기획까지.
        </p>
      </div>
    </section>
  );
}
