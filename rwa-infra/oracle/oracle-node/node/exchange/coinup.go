package exchange

import (
	"fmt"

	"github.com/cpchain-network/oracle-node/store"

	"github.com/pkg/errors"

	gresty "github.com/go-resty/resty/v2"
)

var errCoinUpHTTPError = errors.New("CoinUp Market Price Http Error")

type Data struct {
	Amount string  `json:"amount"`
	High   string  `json:"high"`
	Vol    string  `json:"vol"`
	Last   float64 `json:"last"`
	Low    string  `json:"low"`
	Buy    float64 `json:"buy"`
	Sell   float64 `json:"sell"`
	Rose   string  `json:"rose"`
	Time   uint64  `json:"time"`
}

type MetaData struct {
	Code    string `json:"code"`
	Msg     string `json:"msg"`
	Message string `json:"message"`
	Data    Data   `json:"data"`
	Succ    bool   `json:"succ"`
}

type CoinUpClient interface {
	GetMarketPrice(symbol string) (float64, error)
}

type Client struct {
	client *gresty.Client
	db     *store.Storage
}

func NewCoinUpClient(baseUrl string) (*Client, error) {
	client := gresty.New()
	client.SetBaseURL(baseUrl)
	client.OnAfterResponse(func(c *gresty.Client, r *gresty.Response) error {
		statusCode := r.StatusCode()
		if statusCode >= 400 {
			method := r.Request.Method
			url := r.Request.URL
			return fmt.Errorf("%d cannot %s %s: %w", statusCode, method, url, errCoinUpHTTPError)
		}
		return nil
	})
	return &Client{
		client: client,
	}, nil
}

func (c *Client) GetMarketPrice() (float64, error) {
	var metaData MetaData
	response, err := c.client.R().
		SetResult(&metaData).
		SetQueryParam("symbol", "cpusdt").
		Get("/open/api/get_ticker")
	if err != nil {
		return 0, fmt.Errorf("cannot market price fail: %w", err)
	}
	if response.StatusCode() != 200 {
		return 0, errors.New("get market price fail")
	}
	var avgPrice float64
	if metaData.Code == "0" {
		avgPrice = (metaData.Data.Buy + metaData.Data.Sell) / 2
	}
	return avgPrice, nil
}

// GetPrice 实现 PriceProvider 接口
func (c *Client) GetPrice() (float64, error) {
	return c.GetMarketPrice()
}

// GetAssetInfo 实现 PriceProvider 接口
func (c *Client) GetAssetInfo() (assetType, assetName string) {
	return "crypto", "CP/USDT"
}
