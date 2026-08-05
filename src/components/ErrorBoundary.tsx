import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  fout: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { fout: null }

  static getDerivedStateFromError(fout: Error): State {
    return { fout }
  }

  componentDidCatch(fout: Error, info: ErrorInfo) {
    console.error('Onverwachte fout in de app:', fout, info.componentStack)
  }

  render() {
    if (this.state.fout) {
      return (
        <div className="foutscherm">
          <h1>Er ging iets mis</h1>
          <p>
            De app is onverwacht gestopt. Ververs de pagina om opnieuw te
            beginnen.
          </p>
          <p role="alert">{this.state.fout.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
