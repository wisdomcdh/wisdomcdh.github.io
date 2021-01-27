---
layout: dir
title: skill inventory
comment: false
inventory:
    -
        order: 라인뱅크
        name: 라인뱅크 업무 개발 프로젝트
        role: PG
        period: 2020.01 ~ 2021.01
        skill: RHEL / java / mysql / eclipse
    -
        order: ㈜티쿤글로벌
        name: 다국가 쇼핑몰 플랫폼 개발
        role: PL, AD, PG
        period: 2016.03 ~ 2020.01
        skill: windows / c# / mssql / visualstudio / iis,.net mvc, wpf, angualrJs
    -
        order: ㈜티쿤글로벌
        name: 일본 웹사이트 개발
        role: AD, PG
        period: 2012.11 ~ 2016.03
        skill: windows / c# / mssql / visualstudio / iis
    -
        order: ㈜유프라아이앤씨
        name: 한국예탁결제원 차세대시스템 운영관리
        role: SM
        period: 2011.03 ~ 2012.11
        skill: unix / c# / java / oracle / eclipse, visualstudio / wpf
    -
        order: ㈜유프라아이앤씨
        name: 한국예탁결제원 차세대시스템
        role: AD, PG
        period: 2008.07 ~ 2011.02
        skill: unix / c# / java / oracle / eclipse, visualstudio / wpf
---
# Skill Inventory

<table>
    <thead>
        <tr>
            <th>발주처</th>
            <th>프로젝트명</th>
            <th>역활</th>
            <th>기간</th>
            <th>개발환경</th>
        </tr>
    </thead>
    <tbody>
{%- for item in page.inventory -%}
        <tr>
            <td>{{item.order}}</td>
            <td>{{item.name}}</td>
            <td>{{item.role}}</td>
            <td>{{item.period}}</td>
            <td>{{item.skill}}</td>
        </tr>
{%- endfor -%}
    </tbody>
</table>