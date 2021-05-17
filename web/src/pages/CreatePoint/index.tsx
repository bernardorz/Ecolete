import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react'
import logo from '../../assets/logo.svg'
import { Link, useHistory } from 'react-router-dom'
import { Map, TileLayer, Marker} from 'react-leaflet'
import { LeafletMouseEvent, LatLngTuple } from 'leaflet'

import api from '../../services/api'
import axios from 'axios'

import { FiArrowDownLeft } from 'react-icons/fi'
import './styles.css'


interface Item {
    id: number;
    title: string;
    image_url: string;
}

interface IBGEUFResponse {
    sigla : string;
}

interface IBGECityResponse {
    nome : string;
}


const CreatePoint = () => {

    const history = useHistory()

    const [items, setItems] = useState<Array<Item>>([])
    const [ufs, setUfs] = useState<String[]>([])
    const [selectedUf, setSelected] = useState('0');
    const [cities, setCities] = useState<String[]>([])
    const [selectedCity, setSelectedCity] = useState('0')
    const [selectedPosition, setSelectedPosition] = useState<LatLngTuple>([0,0])
    const [selectedItems, setSelectedItems] = useState<number[]>([])

    const [formData, setFormData] = useState({
        name : '',
        email: '',
        whatsapp : ''
    })

    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data)
        })
    }, [])

    useEffect(() => {
       axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
       .then(response => {
           const ufInitials = response.data.map( uf => uf.sigla).sort()
           setUfs(ufInitials)
       })
    })


    useEffect(() => {
        if(selectedUf === '0'){
            return;
        }

        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`)
        .then(response => {
            const cityNames = response.data.map( city => city.nome)
            setCities(cityNames)
            
        })

    }, [selectedUf])

    const handleSelectedUf = (event:ChangeEvent<HTMLSelectElement>) => {
        const uf = event.target.value
        setSelected(uf)
    }

    const handleSelectedCity = (event:ChangeEvent<HTMLSelectElement>) => {
        const city = event.target.value
        setSelectedCity(city)
    }

    const handleMapClick = (event:LeafletMouseEvent) => {

        //console.log(event.latlng)
        setSelectedPosition([
            event.latlng.lat,
            event.latlng.lng
        ])
    }

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target
            setFormData({...formData, [name] : value})
    }

    const handleSelectItem = (id : number) => {
        const alreadySelected = selectedItems.findIndex(item => item === id)
        if(alreadySelected >= 0){
            const filteredItems = selectedItems.filter(item => item !==id)
            setSelectedItems(filteredItems)
        } else {
            setSelectedItems([...selectedItems, id])
        }
    }


    const handleSubmit  = async (event : FormEvent) => {

        event.preventDefault()
       
        const { name,email,whatsapp} = formData
        const uf = selectedUf
        const city = selectedCity
        const [latitude, longitude] = selectedPosition
        const items = selectedItems

        const data = {
            name,
            email,
            items,
            whatsapp,
            uf,
            city,
            latitude,
            longitude
        }

        await api.post('points', data)

        alert("ok")
        history.push('/')
    }

    

    return (
        <div id="page-create-point">
            <header>
                <img src={logo} alt="Ecolete" />
                <Link to="/">
                    <FiArrowDownLeft />
            Voltar para home
            </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br /> ponto de coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>

                    <div className="field">
                        <label htmlFor="name">Nome da entidade</label>
                        <input
                            type="text"
                            name="name"
                            id="name"
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="email">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                onChange={handleInputChange}
                            />
                        </div>
                        <div className="field">
                            <label htmlFor="whatsapp">Whatsapp</label>
                            <input
                                type="text"
                                name="whatsapp"
                                id="whatsapp"
                                onChange={handleInputChange}
                            />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço no mapa</span>

                    </legend>

                    <Map center={[-28.686777, -49.393472]} zoom={13} scrollWheelZoom={false} onClick={handleMapClick}>
                        <TileLayer
                            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        
                         <Marker  position={selectedPosition} />
                       

                    </Map>
                     
                     
                   



                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select name="uf" id="uf" value={selectedUf} onChange={handleSelectedUf}>
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={String(uf)} value={String(uf)} > {uf} </option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade</label>
                            <select name="city" id="city" value={selectedCity} onChange={handleSelectedCity}>
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={String(city)} value={String(city)} > {city} </option>
                                ))}
                            </select>
                        </div>

                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de coleta</h2>
                        <span>selecione um ou mais itens abaixo</span>
                    </legend>

                    <ul className="items-grid">

                    {items.map((item) => {
                        return ( 
                            <li key={item.id} onClick={() => handleSelectItem(item.id)}
                            className={selectedItems.includes(item.id) ? 'selected' : ''}
                            >
                               <img src={item.image_url} alt={item.title} />
                               <span>{item.title}</span> 
                            </li>
                        )
                    })}
                                   
                    </ul>
                </fieldset>

                <button type="submit">
                    Cadastrar ponto de coleta
                </button>
            </form>

        </div>
    )
}

export default CreatePoint