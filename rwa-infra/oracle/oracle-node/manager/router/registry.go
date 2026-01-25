package router

import (
	"errors"
	"net/http"

	"github.com/ethereum/go-ethereum/log"

	"github.com/cpchain-network/oracle-node/manager/types"
	"github.com/cpchain-network/oracle-node/store"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

type Registry struct {
	signService types.SignService
	db          *store.Storage
}

func NewRegistry(signService types.SignService, db *store.Storage) *Registry {
	return &Registry{
		signService: signService,
		db:          db,
	}
}

func (registry *Registry) SignMsgHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		var request types.RequestBody
		if err := c.ShouldBindJSON(&request); err != nil {
			c.JSON(http.StatusBadRequest, errors.New("invalid request body"))
			return
		}
		if request.BlockNumber == 0 || request.RequestId == "" {
			c.JSON(http.StatusBadRequest, errors.New("tx_hash, block_number and tx_type must not be nil"))
			return
		}
		var result *types.SignResult
		var err error

		result, err = registry.signService.NotifyNodeSubmitPriceWithSignature(request)

		if err != nil {
			c.String(http.StatusInternalServerError, "failed to sign msg")
			log.Error("failed to sign msg", "error", err)
			return
		}
		if _, err = c.Writer.Write(result.Signature.Serialize()); err != nil {
			log.Error("failed to write signature to response writer", "error", err)
		}
	}
}

func (registry *Registry) PrometheusHandler() gin.HandlerFunc {
	h := promhttp.InstrumentMetricHandler(
		prometheus.DefaultRegisterer, promhttp.HandlerFor(
			prometheus.DefaultGatherer,
			promhttp.HandlerOpts{MaxRequestsInFlight: 3},
		),
	)
	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}
