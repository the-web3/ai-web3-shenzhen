package types

type SignService interface {
	NotifyNodeSubmitPriceWithSignature(request RequestBody) (*SignResult, error)
}
