import { useState } from 'react'
import { attProduct, getPackageByProduct, getProduct, isPackage, validateProduct } from './service'
import './styles.css'

type AttProduct = {
  product_code: number
  new_price: number
}

type Product = {
  code: number
  name: string
  old_price: number
  new_price: number
  error?: string[]
}

function App() {
  const [csv, setCsv] = useState<AttProduct[]>([])
  const [, setInputFile] = useState<HTMLInputElement>()
  const [products, setProducts] = useState<Product[]>([])
  const [isOk, setIsOk] = useState<boolean>(true)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setInputFile(event.target)
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result
        if (typeof content === 'string') {
          const lines = content.split('\n')
          const csv: AttProduct[] = []
          for (let i = 1; i < lines.length; i++) {
            const [product_code, new_price] = lines[i].split(',')
            if (isNaN(Number(product_code)) || isNaN(Number(new_price))) {
              setIsOk(false)
            }
            csv.push({
              product_code: isNaN(Number(product_code)) ? 0 : Number(product_code),
              new_price: isNaN(Number(new_price)) ? 0 : Number(new_price),
            })
          }
          setCsv(csv)
        }
      }
      reader.readAsText(file)
    }
    event.target.value = ''
    setProducts([])
    setIsOk(true)
  }

  const productIsInAPack = async (product_code: number) => {
    let error = true;
    let pack = null;
    await getPackageByProduct(product_code)
      .then(async (response) => {
        if (response.message) {
          error = false
        } else {
         for (const item of csv) {
           await isPackage(item.product_code)
              .then((res) => {
                if (res.message) {
                  error = true
                } else {
                  if (response.pack_id == item.product_code) {
                    pack = res
                  }
                }
              })
         }
        }
      });
    if (pack) {
      return false
    } else {
      return error;
    }
  }

  const productIsAPack = async (product_code: number) => {
    let error = true;
    let pack = null;
    await isPackage(product_code)
      .then(async (response) => {
        if (response.message) {
          error = false;
        } else {
          for(const item of csv) {
            await getPackageByProduct(item.product_code)
              .then((resp) => {
                if (resp.message) {
                  error = true
                } else {
                  if (resp.pack_id == product_code) {
                    pack = resp 
                  }
                }
              })
          }
        }
      });
    if (pack) {
      return false
    } else {
      return error
    }
  }

  const attProducts = async () => {
    for(const item of csv){
      await attProduct(item.product_code, item.new_price)
    }

    setInputFile(undefined);
    setProducts([])
    setIsOk(true)
    setCsv([])
  }

  const validate = async () => {
    for(const item of csv){
      const product: Product = {
        code: item.product_code,
        name: '',
        old_price: 0,
        new_price: item.new_price,
        error: [],
      };
    const error: string[] = []
    
    if (item.product_code == 0) {
      error.push('Product Code is not valid')
    }
    
    if(error.length > 0 && error[0] != "") {
      product.error = error
      setProducts((actual) => [...actual, product])
    } else {

    await getProduct(item.product_code)
      .then(async (response) => {
        if (response.message) {
          error.push(response.message)
          product.error = error
        } else {
          product.code = response.code
          product.name = response.name
          product.old_price = response.sales_price
          product.new_price = item.new_price
          await validateProduct(item.product_code, item.new_price)
          .then((response) => {
            if (response) {
              error.push(response)
              product.error = error
            } else {
              product.error = error
            }
          })
          if(await productIsAPack(item.product_code)){
            error.push('There is no update for the products in this pack')
            product.error = error
          }
    
          if(await productIsInAPack(item.product_code)){
            error.push('There is no update for the pack in which this product is')
            product.error = error
          }
        }
      });

      if (error.length > 0 && error[0] != "") {
        setIsOk(false)
      }

      setProducts((actual) => [...actual, product])
      }
    }
  }

  return (
    <>
      <div>
        <input style={{ display: 'none'}} type="file" name="CSV" id="CSV" onChange={handleFileChange} />
        <label htmlFor="CSV" id='file'>Selecionar arquivo</label>
        <button id='validate' disabled={!(csv.length > 0)} onClick={validate}>Validar</button>
      </div>
     
      { products.length > 0 ? products.map((product, index) => (
        <div className='product' key={index}>
        <span className='code'>
          <strong>Product Code</strong>
          <p>{product.code}</p>  
        </span>  
        <span className='name'>
          <strong>Name</strong>
          <p>{product.name}</p>
        </span>
        <span className='old'>
          <strong>Old Price</strong>
          <p>R$ {product.old_price}</p>
        </span>
        <span className='new'>
          <strong>New Price</strong>
          <p>R$ {product.new_price}</p>
        </span>
        <span className='errors'>
          <strong>Errors</strong>
          {product.error?.length > 0 && product.error[0] != "" ? product.error?.map((error, indexError) => (
            <p key={indexError}>{error}</p>
        )): "No errors"}
        </span>
      </div>
      )): ""}

      {isOk && products.length > 0 ? <button id='atualizar' onClick={attProducts}>Atualizar</button> : ""}
    </>
  )
}

export default App
