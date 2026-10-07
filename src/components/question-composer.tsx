"use client";
import { useState } from "react";
export function QuestionComposer() {
  const [content, setContent] = useState("");
  return <section className="card space-y-3">
    <h2 className="text-xl font-bold">匿名で質問する</h2>
    <label htmlFor="question-content">質問内容</label>
    <textarea id="question-content" className="block w-full" rows={5} value={content} onChange={event => setContent(event.target.value)} />
    <p>{content.length}文字</p>
    <button type="button" disabled>質問を送信（準備中）</button>
  </section>;
}
