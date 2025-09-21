/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly REACT_APP_OPENAI_API_KEY: string
    readonly REACT_APP_OPENAI_BASE_URL: string
    readonly REACT_APP_DEEPSEEK_API_KEY: string
    readonly REACT_APP_DEEPSEEK_BASE_URL: string
    readonly REACT_APP_OPENROUTER_API_KEY: string
    readonly REACT_APP_OPENROUTER_BASE_URL: string
    readonly REACT_APP_DEFAULT_MODEL: string
    readonly REACT_APP_DEFAULT_BASE_URL: string
    readonly REACT_APP_DEFAULT_STREAM: string
    readonly REACT_APP_DEFAULT_CHAPTER_WORD_TARGET: string
    readonly REACT_APP_APP_TITLE: string
    readonly [key: string]: string
  }
}