import type { TranscriptEvent } from "../neosantara/runner.js";

function truncate(str: string, maxLen = 2000): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + "\n... (truncated)";
}

export function formatTranscriptToMarkdown(
  transcript: TranscriptEvent[],
  finalText: string,
  usage: any,
): string {
  let markdown = `### Garda Code Action report\n\n${finalText}\n\n`;

  markdown += `## 🔍 Garda Tool Execution Steps\n\n`;
  markdown += `<details>\n<summary>Click to view detailed execution logs (${transcript.length} events)</summary>\n\n`;

  let currentStep = 0;
  for (const event of transcript) {
    if (event.step !== currentStep) {
      currentStep = event.step;
      markdown += `### 🔄 Step ${currentStep}\n\n`;
    }

    if (event.type === "response") {
      markdown += `🤖 **Neosantara Response Received**\n`;
      if (event.responseId) {
        markdown += `- Response ID: \`${event.responseId}\`\n`;
      }
      if (event.output && typeof event.output === "object") {
        const out = event.output as any;
        if (out.usage) {
          markdown += `- Step Usage: ${out.usage.input_tokens || 0} input, ${out.usage.output_tokens || 0} output tokens\n`;
        }
      }
      markdown += `\n`;
    } else if (event.type === "tool_call") {
      markdown += `🔧 **Tool Call:** \`${event.name}\`\n`;
      if (event.input) {
        const params =
          typeof event.input === "string"
            ? event.input
            : JSON.stringify(event.input, null, 2);
        markdown += `**Arguments:**\n\`\`\`json\n${params}\n\`\`\`\n\n`;
      }
    } else if (event.type === "tool_result") {
      const status = event.ok ? "🟢 Success" : "❌ Failed";
      markdown += `**Result:** ${status}\n`;
      if (event.output !== undefined && event.output !== null) {
        const outStr =
          typeof event.output === "string"
            ? event.output
            : JSON.stringify(event.output, null, 2);
        markdown += `\`\`\`text\n${truncate(outStr)}\n\`\`\`\n\n`;
      }
    } else if (event.type === "guard") {
      markdown += `⚠️ **Guard Triggered:** \`${event.name || "unknown"}\`\n`;
      markdown += `Reason: ${event.output}\n\n`;
    }
  }

  markdown += `</details>\n\n`;

  if (usage && typeof usage === "object") {
    markdown += `### 📊 Token Usage Summary\n`;
    markdown += `- Input tokens: **${usage.input_tokens || 0}**\n`;
    markdown += `- Output tokens: **${usage.output_tokens || 0}**\n`;
    markdown += `- Total tokens: **${(usage.input_tokens || 0) + (usage.output_tokens || 0)}**\n\n`;
  }

  return markdown;
}
