import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import marked from 'marked/lib/marked';
import { Token, Tokens, TokensList } from 'marked';
import LedgeMarkdownConverter from '../components/model/ledge-markdown-converter';

@Component({
  selector: 'ledge-render',
  templateUrl: './ledge-render.component.html',
  styleUrls: ['./ledge-render.component.scss'],
})
export class LedgeRenderComponent implements OnInit, AfterViewInit, OnChanges {
  @Input()
  content: string;
  markdownData: any[] = [];
  token: null;
  tokens: TokensList | any = [];

  constructor() {}

  ngOnInit(): void {
    this.renderContent(this.content);
  }

  ngAfterViewInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    const { content } = changes;
    this.content = content.currentValue;
    this.renderContent(this.content);
  }

  private renderContent(content: string) {
    this.markdownData = [];
    const tokens = marked.lexer(content);
    this.tokens = tokens.reverse();

    while (this.next()) {
      this.tok();
    }
  }

  next(): Token {
    this.token = this.tokens.pop();
    return this.token;
  }

  peek() {
    return this.tokens[this.tokens.length - 1] || 0;
  }

  private tok() {
    const token: Token = this.token;
    switch (token.type) {
      case 'table':
        this.markdownData.push(token);
        break;
      case 'code':
        this.handleCode(token);
        break;
      case 'space':
        break;
      case 'blockquote_start':
        let body = '';
        while (this.next().type !== 'blockquote_end') {
          body += this.tok();
        }
        this.markdownData.push({ type: 'blockquote', text: body });
        break;
      case 'paragraph':
        return this.handleParaGraph(token);
      case 'text':
        return token.text;
      case 'heading':
        const inline = marked.inlineLexer(token.text, this.tokens.links);
        this.markdownData.push({
          type: 'heading',
          depth: token.depth,
          text: inline,
        });
        break;
      default:
        console.log(token);
        this.markdownData.push(token);
        break;
    }
  }

  private handleParaGraph(token: marked.Tokens.Paragraph) {
    const inline = marked.inlineLexer(token.text, this.tokens.links);
    this.markdownData.push({
      type: 'paragraph',
      data: inline,
    });

    return inline;
  }

  private handleCode(token: marked.Tokens.Code) {
    const codeBlock = token as Tokens.Code;
    switch (codeBlock.lang) {
      case 'chart':
        const chartData = LedgeMarkdownConverter.toJson(codeBlock.text);
        this.markdownData.push({ type: 'chart', data: chartData.tables[0] });
        break;
      case 'process-step':
        const stepData = LedgeMarkdownConverter.toJson(codeBlock.text);
        this.markdownData.push({
          type: 'process-step',
          data: stepData.lists[0],
        });
        break;
      case 'process-table':
        const tableData = LedgeMarkdownConverter.toJson(codeBlock.text);
        this.markdownData.push({
          type: 'process-table',
          data: tableData.tables[0],
        });
        break;
      case 'mindmap':
        const mindmapData = LedgeMarkdownConverter.toJson(codeBlock.text);
        this.markdownData.push({ type: 'mindmap', data: mindmapData.lists[0] });
        break;
      case 'pyramid':
        const pyramidData = LedgeMarkdownConverter.toJson(codeBlock.text);
        this.markdownData.push({ type: 'pyramid', data: pyramidData.lists[0] });
        break;
      case 'radar':
        const radarData = LedgeMarkdownConverter.toJson(codeBlock.text);
        this.markdownData.push({
          type: 'radar',
          data: radarData.lists[0],
          config: radarData.config,
        });
        break;
      case 'quadrant':
        const quadrantData = LedgeMarkdownConverter.toJson(codeBlock.text);
        this.markdownData.push({
          type: 'quadrant',
          data: quadrantData.lists[0],
        });
        break;
      case 'toolset':
        const json = LedgeMarkdownConverter.toJson(codeBlock.text);
        const toolType = json.config.type;
        this.markdownData.push({
          type: 'toolset',
          data: { type: toolType, data: this.getDataByType(json, toolType) },
        });
        break;
      case 'graphviz':
        this.markdownData.push({ type: 'graphviz', data: codeBlock.text });
        break;
      case 'echarts':
        this.markdownData.push({ type: 'echarts', data: codeBlock.text });
        break;
      case 'list-style':
        const listData = LedgeMarkdownConverter.toJson(codeBlock.text);
        this.markdownData.push({
          type: 'list-style',
          data: listData.lists[0].children,
          config: listData.config,
        });
        break;
      default:
        this.markdownData.push(token);
        break;
    }
  }

  private getDataByType(
    json: { tables: any[]; lists: any[]; config: any },
    type: any
  ) {
    switch (type) {
      case 'slider':
        return json.lists[0].children;
      case 'line-chart':
        return json.tables[0];
      default:
        return json;
    }
  }

  stringify(str: any) {
    return JSON.stringify(str);
  }
}
