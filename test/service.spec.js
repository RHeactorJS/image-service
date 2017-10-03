/* global Buffer describe it process beforeEach expect */

import {handler} from '../src'
import fs from 'fs'
import jwt from 'jsonwebtoken'
import {Index, Status} from '@rheactorjs/models'

const contentType = 'application/vnd.rheactorjs.image-service.v1+json'

describe('service', () => {
  beforeEach(function () {
    if (!process.env.AWS_ACCESS_KEY_ID) this.skip('AWS_ACCESS_KEY_ID is not set!')
  })
  describe('/index', () => {
    it('should return the list of operations', done => {
      handler({
        httpMethod: 'GET',
        headers: {
          'Content-Type': contentType
        },
        path: '/index'
      }, null, (err, res) => {
        expect(err).toEqual(null)
        expect(res.statusCode).toEqual(200)
        expect(res.headers['Content-Type']).toEqual(contentType)
        const index = Index.fromJSON(JSON.parse(res.body))
        expect(index.$links).toHaveLength(2) // Index should have 2 links
        expect(index.$links.filter(({subject}) => subject.equals(Status.$context))).toHaveLength(1) // Index should link to Status
        done()
      })
    })
  })

  describe('/status', () => {
    it('should return the status', done => {
      handler({
        httpMethod: 'POST',
        headers: {
          'Content-Type': contentType
        },
        path: '/status'
      }, null, (err, res) => {
        expect(err).toEqual(null)
        expect(res.statusCode).toEqual(200)
        expect(res.headers['Content-Type']).toEqual(contentType)
        const status = Status.fromJSON(JSON.parse(res.body))
        expect(status.status).toEqual('ok')
        expect(status.version).toMatch(/^0\.0\.0\+testing\.[0-9]+$/)
        done()
      })
    })
  })

  describe('/upload', () => {
    it('should scale and upload a JPEG image', done => {
      const imageData = Buffer.from(fs.readFileSync('./test/data/d4d4d4.jpg')).toString('base64')
      const privateKey = fs.readFileSync('./test/data/private.key', 'utf-8')
      const token = jwt.sign({}, privateKey, {
        algorithm: 'RS256',
        subject: 'https://example.com/user/5',
        expiresIn: 60 * 60
      })

      const event = {
        body: `{"$context":"https://github.com/RHeactorJS/image-service#Upload","image":"${imageData}","mimeType":"image/jpeg"}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': contentType
        },
        httpMethod: 'POST',
        path: '/upload'
      }

      handler(event, undefined, (err, response) => {
        expect(err).toEqual(null)
        expect(response.statusCode).toEqual(200)
        expect(response.headers['Content-Type']).toEqual(contentType)
        const b = JSON.parse(response.body)
        expect(b.$context).toEqual('https://github.com/RHeactorJS/image-service#UploadResult')
        expect(b.url).toMatch(/^http:\/\/images\.example\.com\/example-com\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}-user-5.jpg/)
        expect(b.mimeType).toEqual('image/jpeg')
        done()
      })
    })

    it('should return error on wrong input', done => {
      const event = {
        body: '{}',
        headers: {
          'Content-Type': contentType
        },
        httpMethod: 'POST',
        path: '/upload'
      }
      handler(event, undefined, (err, response) => {
        expect(err).toEqual(null)
        expect(response.statusCode).toEqual(400)
        done()
      })
    })
  })
})
