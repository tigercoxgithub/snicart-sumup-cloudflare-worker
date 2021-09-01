async function handleRequest(request, response) {
  const {
    pathname
  } = new URL(request.url)
    switch (pathname) {

    case '/': {
        const html = await SNIPCARTKV.get("snipcart-custom-pay-html")
          if (html === null) {
            return new Response("KV value not found", {
              status: 404
            })
          }

          return new Response(html, {
          headers: {
            "content-type": "text/html;charset=UTF-8",
          },
        })
      }

    case '/payment-methods': {

        if (request.body) {

          try {
            // THIS CHECK ISNT IMPLEMENTED Validate the request was made by Snipcart
            await fetch(`https://payment.snipcart.com/api/public/custom-payment-gateway/validate?publicToken=${request.body.publicToken}`)
            let paymentMethodList = [{
                id: 'sleeky_pay',
                name: 'TigerPay',
                checkoutUrl: 'https://xxx.workers.dev/',
              }
            ]
            const json = JSON.stringify(paymentMethodList)

              return new Response(json, {
              status: 200,
              headers: {
                'content-type': 'application/json;charset=UTF-8',
              },
            });
          }
          // end try
          catch (err) {
            console.log('Error fetching snipcart api', err)
          };
          // end error catch
        }
        // end if statement and return response to say request not from snipcart
        else
          return new Response('Request has no body and token', {
            status: 401,
            headers: {
              'Cache-Control': 'no-store',
            },
          });

      }
      // end case statement

    case '/payment-session': {
        try {
          const {
            searchParams
          } = new URL(request.url)
            let publicToken = searchParams.get('publicToken')
            console.log('Public Token Recived in query: ' + publicToken)

            const resp = await fetch(`https://payment.snipcart.com/api/public/custom-payment-gateway/payment-session?publicToken=${publicToken}`)
            console.log(resp.data)
            return new Response(resp.data, {
            status: 200,
            headers: {
              'content-type': 'application/json;charset=UTF-8',
            },
          });
        } catch (e) {
          console.error(e)
          return new Response('Error', {
            status: 500,
            headers: {
              'Cache-Control': 'no-store',
            },
          });
        }
      }

    case '/confirm-payment': {
        //Validate the request was approved by your payment gateway (in this case Google Pay)





        // Parse the gateway payment info to match Snipcart's schema
        // This will change depending on the payment gateway you choose

        // below I extract info from the url and body of the incoming request
        const {
          searchParams
        } = new URL(request.url)
          let mypaymentSessionId = searchParams.get('sessionId')
          console.log('Session id in query: ' + mypaymentSessionId)

          const incomingjson = await request.json()
          const requestId = incomingjson.requestId
          console.log('Request id in body: ' + requestId)
          const refundlink = `https://xxx.workers.dev/refund?transactionId=${requestId}`

          try {

            // Confirm payment with Snipcart

            // JSON.stringify When receiving data from a web server, the data is always a string
            // Parse the data with JSON.parse(), and the data becomes a JavaScript object

            // When sending data to a web server, the data has to be a string
            // Convert a JavaScript object into a string with JSON.stringify()

            const b1 = mypaymentSessionId
              const b2 = 'processing'
              const b3 = requestId
              const b4 = 'Your payment will appear on your statement in the coming days'
              const b5 = refundlink

              const postbody = {
              paymentSessionId: b1,
              state: b2,
              transactionId: b3,
              instructions: b4,
              links: {
                refunds: b5
              }
            }

            const request1 = await fetch('https://payment.snipcart.com/api/private/custom-payment-gateway/payment', {
              method: "POST",
              body: JSON.stringify(postbody),
              headers: {
                Authorization: 'Bearer xxx',
                'content-type': 'application/json;charset=UTF-8',
              },
            })

              const result = await request1.json()
              const myreturnUrl = result.returnUrl
              console.log('Post request response: ' + JSON.stringify(result))
              // end

              // ReturnUrl will redirect the user to the Order confirmation page of Snipcart

              const json = JSON.stringify({
              ok: true,
              returnUrl: myreturnUrl
            })
              return new Response(json, {
              status: 200,
              headers: {
                'content-type': 'application/json;charset=UTF-8',
              },
            })
          } catch (e) {
            console.error(e)
            return new Response('Confirming payment ' + e, {
              status: 500,
              headers: {
                'Cache-Control': 'no-store',
              },
            });
          }
      }

    case '/refund': {

        const {
          searchParams
        } = new URL(request.url)
          let transactionId = searchParams.get('transactionId')
          console.log('Transaction id in query: ' + transactionId)

          try {
            // Validate the request was made by Snipcart
            await fetch(`https://payment.snipcart.com/api/public/custom-payment-gateway/validate?publicToken=${request.body.publicToken}`)

            // TODO: Refund the order via the gateway

            // process the refund
            const json = JSON.stringify({
              refundId: transactionId
            })
              return new Response(json, {
              status: 200,
              headers: {
                'content-type': 'application/json;charset=UTF-8',
              },
            })
          } catch (e) {
            // couldnt validate the request
            console.error(e)
            return new Response('Couldnt validate the request: ' + e, {
              status: 401,
              headers: {
                'Cache-Control': 'no-store',
              },
            });
          }
      }

    }
    return new Response('Not Found.', {
    status: 404
  })
}

addEventListener('fetch', event => {
  event.respondWith(
    handleRequest(event.request)
    .then(response => {
      response.headers.set('Access-Control-Allow-Origin', '*')
      return response
    })
    .catch(err => {
      console.log('Error on fetch event', err)
      const message = err.reason || err.stack || 'Unknown Error'
        return new Response(message, {
        status: err.status || 500,
        statusText: err.statusText || null,
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          // Disables caching by default.
          'Cache-Control': 'no-store',
          // Returns the "Content-Length" header for HTTP HEAD requests.
          'Content-Length': message.length,
        },
      })
    }), )
});